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
 * A service responsible for managing the complete citizen reporting workflow
 * in the Wasel backend system.
 *
 * This service handles:
 * - Creating citizen reports
 * - Retrieving lists of reports with filtering and pagination
 * - Retrieving a single report with related details
 * - Approving reports and linking them to incidents
 * - Rejecting reports
 * - Merging duplicate reports
 * - Recording report votes
 * - Detecting possible duplicate submissions
 * - Calculating and updating confidence scores
 *
 * Responsibilities:
 * - Enforce business rules beyond DTO validation
 * - Interact with the database using Prisma
 * - Preserve moderation consistency through transactions
 * - Prevent invalid voting and moderation actions
 * - Maintain report reliability scoring
 *
 * Dependencies:
 * - PrismaService: Used for all database access and persistence
 *
 * Notes:
 * - Moderation actions are logged for auditability
 * - Some operations use transactions to keep related changes consistent
 * - Confidence scores are recalculated after major report lifecycle events
 */
@Injectable()
export class CitizenReportsService {
  /**
   * Constructor
   * -----------
   * Initializes the CitizenReportsService with PrismaService.
   *
   * @param prisma - Prisma service used for querying and updating the database
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * create
   * ------
   * Creates a new citizen report and performs initial validation,
   * duplicate detection, and confidence score assignment.
   *
   * Process:
   * 1. Ensures either regionId or coordinates are provided
   * 2. Validates that the report description is not empty
   * 3. Confirms that the category exists
   * 4. Confirms that the region exists when regionId is provided
   * 5. Applies anti-spam protection using a minimum submission interval
   * 6. Detects possible duplicate reports
   * 7. Calculates an initial confidence score
   * 8. Stores the report in the database
   *
   * @param dto - Payload used to create the report
   * @param user - Authenticated user submitting the report
   * @returns Created report along with duplicate detection and confidence metadata
   *
   * Throws:
   * - BadRequestException if required data is missing or invalid
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
   * Retrieves a paginated list of reports with optional filtering and sorting.
   *
   * Supports:
   * - Filtering by status, category, region, incident, and user
   * - Filtering by date range
   * - Sorting by supported fields
   * - Pagination through page and limit
   *
   * @param query - Query parameters for filtering, sorting, and pagination
   * @returns Paginated collection of reports and total metadata
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
   * Retrieves a single report by its identifier with related entities.
   *
   * Behavior:
   * - Loads category, region, incident, duplicate relationships, and votes
   * - Restricts citizen users to accessing only their own reports
   *
   * @param id - Report identifier
   * @param user - Authenticated user requesting the report
   * @returns Detailed report object with normalized confidence score
   *
   * Throws:
   * - NotFoundException if the report does not exist
   * - ForbiddenException if the user is not allowed to view the report
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
   * Approves a citizen report and either links it to an existing incident
   * or creates a new incident when needed.
   *
   * Process:
   * 1. Confirms that the report exists
   * 2. Prevents approving an already approved report
   * 3. Loads an existing incident if incidentId is provided
   * 4. Creates a new incident if no incident is linked
   * 5. Updates the report status to approved
   * 6. Stores a moderation action record
   * 7. Recalculates the report confidence score
   *
   * Transaction Use:
   * - Keeps incident creation/linking, report update, and moderation log atomic
   *
   * @param id - Report identifier
   * @param dto - Approval request payload
   * @param moderator - Moderator or admin performing the approval
   * @returns Updated approved report with recalculated confidence score
   *
   * Throws:
   * - NotFoundException if the report or incident does not exist
   * - BadRequestException if the report is already approved
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
   * Rejects a report and records the moderation action.
   *
   * Process:
   * 1. Confirms that the report exists
   * 2. Prevents rejecting an already approved report
   * 3. Updates the report status to rejected
   * 4. Stores a moderation action record
   * 5. Recalculates the report confidence score
   *
   * Transaction Use:
   * - Keeps report status update and moderation logging consistent
   *
   * @param id - Report identifier
   * @param dto - Rejection request payload
   * @param moderator - Moderator or admin performing the rejection
   * @returns Updated rejected report with recalculated confidence score
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
   * Merges a source report into a target report and records the moderation action.
   *
   * Process:
   * 1. Prevents merging a report into itself
   * 2. Confirms that both source and target reports exist
   * 3. Marks the source report as merged
   * 4. Links it to the target report as a duplicate
   * 5. Preserves or inherits the related incident when available
   * 6. Stores a moderation action record
   * 7. Recalculates the merged report confidence score
   *
   * Transaction Use:
   * - Keeps merge update and moderation log consistent
   *
   * @param id - Source report identifier
   * @param dto - Merge request payload containing the target report ID
   * @param moderator - Moderator or admin performing the merge
   * @returns Updated merged report with recalculated confidence score
   *
   * Throws:
   * - BadRequestException if the merge is invalid
   * - NotFoundException if the source or target report is missing
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
   * Records a user vote on a report and updates its confidence score.
   *
   * Process:
   * 1. Confirms that the report exists
   * 2. Prevents users from voting on their own reports
   * 3. Prevents duplicate votes from the same user
   * 4. Creates the vote record
   * 5. Recalculates the report confidence score
   *
   * @param id - Report identifier
   * @param dto - Voting request payload
   * @param user - Authenticated user casting the vote
   * @returns Vote result including updated confidence score
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
   * Searches for possible duplicate reports based on category,
   * region, and report submission time proximity.
   *
   * Behavior:
   * - Looks only at reports with pending or approved status
   * - Applies a time window around the submitted report time
   * - Optionally narrows results by region
   * - Returns a limited list of candidate duplicates
   *
   * Purpose:
   * - Helps identify repeated reports describing the same event
   * - Supports moderation decisions and confidence scoring
   *
   * @param input - Duplicate detection criteria
   * @returns Candidate duplicate reports
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
   * Calculates a report confidence score using moderation status,
   * vote counts, and duplicate penalties.
   *
   * Scoring Logic:
   * - Applies a base value according to report status
   * - Adds points for confirm votes
   * - Subtracts points for deny votes
   * - Applies a penalty for duplicate linkage
   * - Clamps the final score between 0 and 100
   *
   * Purpose:
   * - Provide a numeric indicator of report reliability
   *
   * @param input - Confidence score calculation inputs
   * @returns Calculated confidence score
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
   * Recomputes a report's confidence score and stores the new value.
   *
   * Process:
   * 1. Loads the report and its current votes
   * 2. Counts confirm and deny votes
   * 3. Applies duplicate penalties when applicable
   * 4. Recalculates the confidence score
   * 5. Persists the updated score in the database
   *
   * @param reportId - Report identifier
   * @returns Updated confidence score
   *
   * Throws:
   * - NotFoundException if the report does not exist
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