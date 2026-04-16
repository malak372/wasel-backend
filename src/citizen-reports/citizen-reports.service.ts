import {
  BadRequestException,
  ConflictException,
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

/**
 * CitizenReportsService
 * ---------------------
 * Author: Malak
 *
 * Service responsible for managing the full citizen report lifecycle.
 *
 * This service handles:
 * - Creating reports
 * - Retrieving reports
 * - Retrieving a single report
 * - Approving reports
 * - Rejecting reports
 * - Merging duplicate reports
 * - Recording user votes
 * - Detecting possible duplicates
 * - Calculating and updating confidence scores
 *
 * Responsibilities:
 * - Validates business rules beyond DTO validation
 * - Interacts with the database using Prisma
 * - Enforces moderation and ownership constraints
 * - Maintains moderation logs and voting integrity
 *
 * Dependencies:
 * - PrismaService: Used for all database operations
 *
 * Notes:
 * - This service works closely with moderation workflows.
 * - Some methods use transactions to ensure consistency across related operations.
 */
@Injectable()
export class CitizenReportsService {
  /**
   * Constructor
   * -----------
   * Injects PrismaService to perform database operations.
   *
   * @param prisma - Prisma client wrapper used for querying and updating the database
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * create
   * ------
   * Creates a new citizen report.
   *
   * @param dto - Data required to create the report
   * @param user - Authenticated user submitting the report
   * @returns Newly created report with duplicate detection metadata
   *
   * Behavior:
   * - Ensures regionId or coordinates are provided
   * - Validates that the description is not empty
   * - Confirms category and region existence
   * - Applies anti-spam protection by enforcing a minimum time gap between submissions
   * - Detects possible duplicate reports
   * - Calculates an initial confidence score
   * - Stores the report in the database
   *
   * Throws:
   * - BadRequestException if required data is invalid or missing
   * - HttpException with TOO_MANY_REQUESTS if reports are submitted too frequently
   */
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

  /**
   * findAll
   * -------
   * Retrieves a filtered, sorted, and paginated list of reports.
   *
   * @param query - Query parameters used for filtering and pagination
   * @returns Paginated report list
   *
   * Behavior:
   * - Applies optional filters such as status, category, region, incident, and user
   * - Supports date range filtering
   * - Supports sorting and ordering
   * - Supports pagination using page and limit
   */
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

  /**
   * findOne
   * -------
   * Retrieves a single report by its identifier.
   *
   * @param id - Report identifier
   * @param user - Authenticated user requesting the report
   * @returns Detailed report data
   *
   * Behavior:
   * - Retrieves related entities such as category, region, incident, duplicates, and votes
   * - Enforces access control for citizen users
   *
   * Throws:
   * - NotFoundException if the report does not exist
   * - ForbiddenException if the user is not allowed to access the report
   */
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
      throw new ForbiddenException('You can only access your own reports');
    }

    return {
      ...report,
      confidenceScore: Number(report.confidenceScore ?? 0),
    };
  }

  /**
   * approve
   * -------
   * Approves a report and optionally links it to an existing incident
   * or creates a new incident.
   *
   * @param id - Report identifier
   * @param dto - Approval payload
   * @param moderator - Authenticated moderator/admin performing the action
   * @returns Approval result with updated report data
   *
   * Behavior:
   * - Verifies that the report exists
   * - Prevents re-approving already approved reports
   * - Links to an existing incident if incidentId is provided
   * - Creates a new incident if needed
   * - Marks the report as approved
   * - Writes a moderation action log
   * - Recalculates confidence score after approval
   *
   * Throws:
   * - NotFoundException if the report or incident is not found
   * - BadRequestException for invalid approval scenarios
   */
  async approve(
    id: string,
    dto: ApproveReportDto,
    moderator: { userId: string; role: string },
  ) {
    const report = await this.prisma.citizenReport.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status === 'approved') {
      throw new BadRequestException('Report already approved');
    }

    let incidentId = report.incidentId ?? null;

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

  /**
   * reject
   * ------
   * Rejects a report and records the moderation decision.
   *
   * @param id - Report identifier
   * @param dto - Rejection payload
   * @param moderator - Authenticated moderator/admin performing the action
   * @returns Rejection result with updated report data
   *
   * Behavior:
   * - Ensures the report exists
   * - Prevents rejecting already approved reports
   * - Updates the report status to rejected
   * - Writes a moderation action log
   * - Recalculates confidence score after rejection
   *
   * Throws:
   * - NotFoundException if the report is not found
   * - BadRequestException if the report cannot be rejected
   */
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

  /**
   * merge
   * -----
   * Merges a source report into a target report.
   *
   * @param id - Source report identifier
   * @param dto - Merge payload containing the target report ID
   * @param moderator - Authenticated moderator/admin performing the action
   * @returns Merge result with updated report data
   *
   * Behavior:
   * - Prevents merging a report into itself
   * - Verifies both source and target reports exist
   * - Marks the source report as merged
   * - Links it to the target report
   * - Writes a moderation action log
   * - Recalculates confidence score after merging
   *
   * Throws:
   * - BadRequestException for invalid merge scenarios
   * - NotFoundException if source or target report is missing
   */
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

  /**
   * vote
   * ----
   * Records a user vote on a report.
   *
   * @param id - Report identifier
   * @param dto - Vote payload
   * @param user - Authenticated user casting the vote
   * @returns Voting result with updated confidence score
   *
   * Behavior:
   * - Ensures the report exists
   * - Prevents users from voting on their own reports
   * - Prevents duplicate votes from the same user
   * - Stores the vote
   * - Recalculates the report confidence score
   *
   * Throws:
   * - NotFoundException if the report does not exist
   * - BadRequestException if the user votes on their own report
   * - ConflictException if the user has already voted
   */
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

    const existingVote = await this.prisma.reportVote.findUnique({
      where: {
        reportId_userId: {
          reportId: id,
          userId: user.userId,
        },
      },
    });

    if (existingVote) {
      throw new ConflictException('You have already voted on this report');
    }

    await this.prisma.reportVote.create({
      data: {
        reportId: id,
        userId: user.userId,
        voteType: dto.voteType as VoteType,
      },
    });

    const confidenceScore = await this.recalculateAndPersistConfidence(id);

    return {
      message: 'Vote submitted successfully',
      confidenceScore,
    };
  }

  /**
   * findDuplicateCandidates
   * -----------------------
   * Searches for possible duplicate reports based on category, region,
   * location, and report time.
   *
   * @param input - Criteria used to find duplicate candidates
   * @returns List of possible duplicate reports
   *
   * Behavior:
   * - Looks for pending or approved reports
   * - Compares category and nearby timing
   * - Optionally narrows results by region or location
   *
   * Purpose:
   * - Helps detect repeated reports of the same incident
   * - Supports confidence scoring and moderation workflows
   */
  private async findDuplicateCandidates(input: {
    categoryId: string;
    regionId?: string;
    latitude?: number;
    longitude?: number;
    reportTime: Date;
  }) {
    const timeWindowMs = 60 * 60 * 1000;
    const from = new Date(input.reportTime.getTime() - timeWindowMs);
    const to = new Date(input.reportTime.getTime() + timeWindowMs);

    const candidates = await this.prisma.citizenReport.findMany({
      where: {
        categoryId: input.categoryId,
        status: { in: ['pending', 'approved'] as ReportStatus[] },
        reportTime: {
          gte: from,
          lte: to,
        },
        ...(input.regionId ? { regionId: input.regionId } : {}),
      },
      select: {
        id: true,
        description: true,
        status: true,
        reportTime: true,
        regionId: true,
      },
      take: 10,
      orderBy: { reportTime: 'desc' },
    });

    return candidates;
  }

  /**
   * calculateConfidenceScore
   * ------------------------
   * Computes a confidence score for a report based on status,
   * user votes, and duplicate penalties.
   *
   * @param input - Confidence score inputs
   * @returns number - Calculated confidence score
   *
   * Behavior:
   * - Applies a base score depending on report status
   * - Increases score for confirm votes
   * - Decreases score for deny votes
   * - Applies duplicate penalty when applicable
   * - Clamps result within a defined range
   *
   * Purpose:
   * - Provides a measurable indicator of report reliability
   */
  private calculateConfidenceScore(input: {
    status: 'pending' | 'approved' | 'rejected' | 'merged';
    confirmVotes: number;
    denyVotes: number;
    duplicatePenalty: number;
  }): number {
    const baseByStatus: Record<string, number> = {
      pending: 50,
      approved: 80,
      rejected: 20,
      merged: 30,
    };

    const score =
      baseByStatus[input.status] +
      input.confirmVotes * 5 -
      input.denyVotes * 5 -
      input.duplicatePenalty;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * recalculateAndPersistConfidence
   * -------------------------------
   * Recomputes a report's confidence score and stores the updated value.
   *
   * @param reportId - Identifier of the report
   * @returns number - Updated confidence score
   *
   * Behavior:
   * - Loads the report and its votes
   * - Counts confirm and deny votes
   * - Applies duplicate penalties if needed
   * - Recalculates the score
   * - Persists the new score in the database
   *
   * Throws:
   * - NotFoundException if the report is missing
   */
  private async recalculateAndPersistConfidence(reportId: string): Promise<number> {
    const report = await this.prisma.citizenReport.findUnique({
      where: { id: reportId },
      include: { votes: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const confirmVotes = report.votes.filter((v) => v.voteType === 'confirm').length;
    const denyVotes = report.votes.filter((v) => v.voteType === 'deny').length;

    const duplicatePenalty = report.duplicateOfReportId ? 10 : 0;

    const score = this.calculateConfidenceScore({
      status: report.status,
      confirmVotes,
      denyVotes,
      duplicatePenalty,
    });

    await this.prisma.citizenReport.update({
      where: { id: reportId },
      data: {
        confidenceScore: new Prisma.Decimal(score.toFixed(2)),
      },
    });

    return score;
  }
}