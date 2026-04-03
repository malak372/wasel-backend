import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus, VoteType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { GetReportsQueryDto } from './dto/get-reports-query.dto';
import { ApproveReportDto } from './dto/approve-report.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { MergeReportDto } from './dto/merge-report.dto';
import { VoteReportDto } from './dto/vote-report.dto';

@Injectable()
export class CitizenReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateReportDto,
    user: { userId: string; role: string },
  ) {
    if (!dto.regionId && (dto.latitude == null || dto.longitude == null)) {
      throw new BadRequestException(
        'regionId or latitude/longitude must be provided',
      );
    }

    if (!dto.description || !dto.description.trim()) {
      throw new BadRequestException('Description is required');
    }

    const category = await this.prisma.incidentCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException('Invalid categoryId');
    }

    if (dto.regionId) {
      const region = await this.prisma.region.findUnique({
        where: { id: dto.regionId },
      });

      if (!region) {
        throw new BadRequestException('Invalid regionId');
      }
    }

    const now = new Date();

    const lastUserReport = await this.prisma.citizenReport.findFirst({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastUserReport) {
      const diffMs = now.getTime() - new Date(lastUserReport.createdAt).getTime();
      const minGapMs = 2 * 60 * 1000;

      if (diffMs < minGapMs) {
        throw new HttpException(
          'Please wait before submitting another report',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const reportTime = dto.reportTime ? new Date(dto.reportTime) : now;

    const duplicateCandidates = await this.findDuplicateCandidates({
      categoryId: dto.categoryId,
      regionId: dto.regionId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      reportTime,
    });

    const initialConfidence = this.calculateConfidenceScore({
      status: 'pending',
      confirmVotes: 0,
      denyVotes: 0,
      duplicatePenalty: duplicateCandidates.length > 0 ? 10 : 0,
    });

    const created = await this.prisma.citizenReport.create({
      data: {
        userId: user.userId,
        categoryId: dto.categoryId,
        description: dto.description.trim(),
        latitude:
          dto.latitude != null
            ? new Prisma.Decimal(dto.latitude.toString())
            : null,
        longitude:
          dto.longitude != null
            ? new Prisma.Decimal(dto.longitude.toString())
            : null,
        regionId: dto.regionId ?? null,
        reportTime,
        status: 'pending',
        confidenceScore: new Prisma.Decimal(initialConfidence.toFixed(2)),
      },
      include: {
        category: true,
        region: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        votes: true,
      },
    });

    return {
      message: 'Report submitted successfully',
      report: created,
      duplicateDetection: {
        possibleDuplicate: duplicateCandidates.length > 0,
        candidates: duplicateCandidates,
      },
      confidenceScore: Number(created.confidenceScore ?? 0),
    };
  }

  async findAll(query: GetReportsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CitizenReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.regionId ? { regionId: query.regionId } : {}),
      ...(query.incidentId ? { incidentId: query.incidentId } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...((query.from || query.to) && {
        reportTime: {
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lte: new Date(query.to) } : {}),
        },
      }),
    };

    const orderByField = query.sortBy ?? 'createdAt';
    const orderByDirection = query.sortOrder ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.citizenReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [orderByField]: orderByDirection,
        },
        include: {
          category: true,
          region: true,
          incident: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          duplicateOfReport: {
            select: {
              id: true,
              description: true,
              status: true,
            },
          },
          votes: true,
        },
      }),
      this.prisma.citizenReport.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async findOne(id: string, user: { userId: string; role: string }) {
    const report = await this.prisma.citizenReport.findUnique({
      where: { id },
      include: {
        category: true,
        region: true,
        incident: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        duplicateOfReport: true,
        duplicateReports: true,
        votes: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (
      user.role === 'citizen' &&
      report.userId &&
      report.userId !== user.userId
    ) {
      throw new ForbiddenException('You can only view your own reports');
    }

    const moderationActions = await this.prisma.moderationAction.findMany({
      where: {
        targetType: 'report',
        targetId: id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        moderatorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    const score = await this.recalculateAndPersistConfidence(report.id);

    return {
      ...report,
      confidenceScore: score,
      moderationActions,
    };
  }

  async approve(
    id: string,
    dto: ApproveReportDto,
    moderator: { userId: string; role: string },
  ) {
    const report = await this.prisma.citizenReport.findUnique({
      where: { id },
      include: {
        category: true,
        incident: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status === 'approved') {
      throw new BadRequestException('Report is already approved');
    }

    if (report.status === 'rejected') {
      throw new BadRequestException('Rejected report cannot be approved');
    }

    let incidentId = dto.incidentId ?? report.incidentId ?? null;

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.incidentId) {
        const existingIncident = await tx.incident.findUnique({
          where: { id: dto.incidentId },
        });

        if (!existingIncident) {
          throw new NotFoundException('Incident not found');
        }

        incidentId = existingIncident.id;
      } else if (!incidentId) {
        const newIncident = await tx.incident.create({
          data: {
            title: dto.title ?? `${report.category.name} reported by citizen`,
            description: dto.description ?? report.description,
            categoryId: report.categoryId,
            severity: dto.severity ?? 'medium',
            status: 'open',
            sourceType: 'crowd',
            checkpointId: dto.checkpointId ?? null,
            regionId: dto.regionId ?? report.regionId ?? null,
            latitude: report.latitude,
            longitude: report.longitude,
            reportedByUserId: report.userId ?? null,
            occurredAt: report.reportTime,
          },
        });

        incidentId = newIncident.id;
      }

      const updatedReport = await tx.citizenReport.update({
        where: { id: report.id },
        data: {
          status: 'approved',
          incidentId,
        },
        include: {
          category: true,
          region: true,
          incident: true,
          votes: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      });

      await tx.moderationAction.create({
        data: {
          targetType: 'report',
          targetId: report.id,
          moderatorUserId: moderator.userId,
          actionType: 'approve',
          reason: dto.reason ?? 'Approved by moderator',
        },
      });

      return updatedReport;
    });

    const confidenceScore = await this.recalculateAndPersistConfidence(result.id);

    return {
      message: 'Report approved successfully',
      report: {
        ...result,
        confidenceScore,
      },
    };
  }

  async reject(
    id: string,
    dto: RejectReportDto,
    moderator: { userId: string; role: string },
  ) {
    const report = await this.prisma.citizenReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status === 'approved') {
      throw new BadRequestException('Approved report cannot be rejected');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const rejected = await tx.citizenReport.update({
        where: { id },
        data: {
          status: 'rejected',
        },
        include: {
          category: true,
          region: true,
          incident: true,
          votes: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      });

      await tx.moderationAction.create({
        data: {
          targetType: 'report',
          targetId: id,
          moderatorUserId: moderator.userId,
          actionType: 'reject',
          reason: dto.reason ?? 'Rejected by moderator',
        },
      });

      return rejected;
    });

    const confidenceScore = await this.recalculateAndPersistConfidence(updated.id);

    return {
      message: 'Report rejected successfully',
      report: {
        ...updated,
        confidenceScore,
      },
    };
  }

  async merge(
    id: string,
    dto: MergeReportDto,
    moderator: { userId: string; role: string },
  ) {
    if (id === dto.targetReportId) {
      throw new BadRequestException('Report cannot be merged into itself');
    }

    const [sourceReport, targetReport] = await Promise.all([
      this.prisma.citizenReport.findUnique({ where: { id } }),
      this.prisma.citizenReport.findUnique({
        where: { id: dto.targetReportId },
      }),
    ]);

    if (!sourceReport) {
      throw new NotFoundException('Source report not found');
    }

    if (!targetReport) {
      throw new NotFoundException('Target report not found');
    }

    const merged = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.citizenReport.update({
        where: { id },
        data: {
          status: 'merged',
          duplicateOfReportId: targetReport.id,
          incidentId: targetReport.incidentId ?? sourceReport.incidentId ?? null,
        },
        include: {
          category: true,
          region: true,
          incident: true,
          duplicateOfReport: true,
          votes: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      });

      await tx.moderationAction.create({
        data: {
          targetType: 'report',
          targetId: id,
          moderatorUserId: moderator.userId,
          actionType: 'merge',
          reason: dto.reason ?? `Merged into report ${targetReport.id}`,
        },
      });

      return updated;
    });

    const confidenceScore = await this.recalculateAndPersistConfidence(merged.id);

    return {
      message: 'Report merged successfully',
      report: {
        ...merged,
        confidenceScore,
      },
    };
  }

  async vote(
    id: string,
    dto: VoteReportDto,
    user: { userId: string; role: string },
  ) {
    const report = await this.prisma.citizenReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.userId === user.userId) {
      throw new BadRequestException('You cannot vote on your own report');
    }

    await this.prisma.reportVote.upsert({
      where: {
        reportId_userId: {
          reportId: id,
          userId: user.userId,
        },
      },
      update: {
        voteType: dto.voteType as VoteType,
      },
      create: {
        reportId: id,
        userId: user.userId,
        voteType: dto.voteType as VoteType,
      },
    });

    const confidenceScore = await this.recalculateAndPersistConfidence(id);

    const votes = await this.prisma.reportVote.groupBy({
      by: ['voteType'],
      where: { reportId: id },
      _count: { voteType: true },
    });

    const confirmVotes =
      votes.find((v) => v.voteType === 'confirm')?._count.voteType ?? 0;
    const denyVotes =
      votes.find((v) => v.voteType === 'deny')?._count.voteType ?? 0;

    return {
      message: 'Vote submitted successfully',
      reportId: id,
      votes: {
        confirm: confirmVotes,
        deny: denyVotes,
      },
      confidenceScore,
    };
  }

  private async findDuplicateCandidates(params: {
    categoryId: string;
    regionId?: string;
    latitude?: number;
    longitude?: number;
    reportTime: Date;
  }) {
    const from = new Date(params.reportTime.getTime() - 2 * 60 * 60 * 1000);
    const to = new Date(params.reportTime.getTime() + 2 * 60 * 60 * 1000);

    const candidates = await this.prisma.citizenReport.findMany({
      where: {
        categoryId: params.categoryId,
        status: {
          in: ['pending', 'approved'],
        },
        reportTime: {
          gte: from,
          lte: to,
        },
      },
      include: {
        category: true,
        region: true,
      },
      orderBy: {
        reportTime: 'desc',
      },
    });

    const filtered = candidates.filter((candidate) => {
      const sameRegion =
        !!params.regionId &&
        !!candidate.regionId &&
        params.regionId === candidate.regionId;

      const nearLocation =
        params.latitude != null &&
        params.longitude != null &&
        candidate.latitude != null &&
        candidate.longitude != null &&
        this.distanceKm(
          params.latitude,
          params.longitude,
          Number(candidate.latitude),
          Number(candidate.longitude),
        ) <= 1;

      return Boolean(sameRegion || nearLocation);
    });

    return filtered.map((item) => ({
      id: item.id,
      status: item.status,
      description: item.description,
      regionId: item.regionId,
      reportTime: item.reportTime,
      confidenceScore: Number(item.confidenceScore ?? 0),
    }));
  }

  private async recalculateAndPersistConfidence(reportId: string) {
    const report = await this.prisma.citizenReport.findUnique({
      where: { id: reportId },
      include: {
        votes: true,
        duplicateOfReport: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const confirmVotes = report.votes.filter(
      (v) => v.voteType === 'confirm',
    ).length;
    const denyVotes = report.votes.filter(
      (v) => v.voteType === 'deny',
    ).length;

    const score = this.calculateConfidenceScore({
      status: report.status,
      confirmVotes,
      denyVotes,
      duplicatePenalty: report.duplicateOfReportId ? 15 : 0,
    });

    await this.prisma.citizenReport.update({
      where: { id: reportId },
      data: {
        confidenceScore: new Prisma.Decimal(score.toFixed(2)),
      },
    });

    return score;
  }

  private calculateConfidenceScore(params: {
    status: ReportStatus;
    confirmVotes: number;
    denyVotes: number;
    duplicatePenalty: number;
  }) {
    let score = 50;

    if (params.status === 'approved') score += 25;
    if (params.status === 'pending') score += 5;
    if (params.status === 'rejected') score -= 25;
    if (params.status === 'merged') score -= 10;

    score += params.confirmVotes * 8;
    score -= params.denyVotes * 8;
    score -= params.duplicatePenalty;

    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return Number(score.toFixed(2));
  }

  private distanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }
}