import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IncidentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { VerifyIncidentDto } from './dto/verify-incident.dto';
import { CloseIncidentDto } from './dto/close-incident.dto';
import { RejectIncidentDto } from './dto/reject-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';

/**
 * IncidentsService
 * ----------------
 * Author: Eman
 *
 * This service contains the business logic for managing incidents
 * in the application.
 *
 * It is responsible for:
 * - Creating new incidents
 * - Retrieving incidents with filtering, sorting, and pagination
 * - Retrieving a single incident by ID
 * - Updating incident details
 * - Verifying incidents
 * - Closing incidents
 * - Rejecting incidents
 * - Retrieving incident status history
 *
 * It also ensures:
 * - Referenced categories, regions, and checkpoints exist
 * - Incident status changes are recorded in status history
 * - Proper validation rules are enforced before updating incident state
 * - Exceptions are thrown when invalid operations occur
 *
 * Dependencies:
 * - PrismaService: Used for database operations
 * - Prisma Client types: Used for typed queries and decimal conversion
 */
@Injectable()
export class IncidentsService {
  /**
   * Constructor
   * -----------
   * Injects PrismaService to interact with the database.
   *
   * @param prisma - Prisma service used for database access
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ensureCategoryExists
   * --------------------
   * Verifies that the provided incident category exists.
   *
   * @param categoryId - Unique identifier of the incident category
   * @returns The category object if found
   * @throws BadRequestException if the category does not exist
   */
  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.incidentCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException('Incident category not found');
    }

    return category;
  }

  /**
   * ensureRegionExists
   * ------------------
   * Verifies that the provided region exists.
   *
   * @param regionId - Unique identifier of the region
   * @returns The region object if found
   * @throws BadRequestException if the region does not exist
   */
  private async ensureRegionExists(regionId: string) {
    const region = await this.prisma.region.findUnique({
      where: { id: regionId },
    });

    if (!region) {
      throw new BadRequestException('Region not found');
    }

    return region;
  }

  /**
   * ensureCheckpointExists
   * ----------------------
   * Verifies that the provided checkpoint exists.
   *
   * @param checkpointId - Unique identifier of the checkpoint
   * @returns The checkpoint object if found
   * @throws BadRequestException if the checkpoint does not exist
   */
  private async ensureCheckpointExists(checkpointId: string) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
    });

    if (!checkpoint) {
      throw new BadRequestException('Checkpoint not found');
    }

    return checkpoint;
  }

  /**
   * appendStatusHistory
   * -------------------
   * Creates a new incident status history record.
   *
   * This helper method centralizes history creation
   * to reduce duplicated code during status transitions.
   *
   * @param tx - Prisma transaction client
   * @param params - Status history data
   * @param params.incidentId - Unique identifier of the incident
   * @param params.oldStatus - Previous incident status
   * @param params.newStatus - New incident status
   * @param params.changedByUserId - User who changed the status
   * @param params.reason - Optional reason for the status change
   * @returns The created incident status history record
   */
  private async appendStatusHistory(
    tx: Prisma.TransactionClient,
    params: {
      incidentId: string;
      oldStatus: IncidentStatus;
      newStatus: IncidentStatus;
      changedByUserId?: string | null;
      reason?: string;
    },
  ) {
    return tx.incidentStatusHistory.create({
      data: {
        incidentId: params.incidentId,
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
        changedByUserId: params.changedByUserId ?? null,
        reason: params.reason,
      },
    });
  }

  /**
   * findOne
   * -------
   * Retrieves a single incident by its unique identifier.
   *
   * Includes related entities such as:
   * - category
   * - region
   * - checkpoint
   * - reporting, verifying, and closing users
   *
   * @param id - Unique identifier of the incident
   * @returns The incident with related data
   * @throws NotFoundException if the incident does not exist
   */
  async findOne(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        category: true,
        region: true,
        checkpoint: true,
        reportedByUser: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        verifiedByUser: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        closedByUser: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }

  /**
   * create
   * ------
   * Creates a new incident in the database.
   *
   * Process:
   * 1. Ensures referenced category exists
   * 2. Ensures referenced region exists if provided
   * 3. Ensures referenced checkpoint exists if provided
   * 4. Creates the incident
   * 5. Adds an initial status history record
   *
   * The initial status is always set to "open".
   *
   * A database transaction is used to ensure
   * both incident creation and history creation succeed together.
   *
   * @param dto - Data required to create a new incident
   * @param currentUserId - ID of the authenticated user creating the incident
   * @returns The created incident with related category, region, and checkpoint
   */
  async create(dto: CreateIncidentDto, currentUserId: string) {
    await this.ensureCategoryExists(dto.categoryId);

    if (dto.regionId) {
      await this.ensureRegionExists(dto.regionId);
    }

    if (dto.checkpointId) {
      await this.ensureCheckpointExists(dto.checkpointId);
    }

    const incident = await this.prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({
        data: {
          title: dto.title,
          description: dto.description,
          categoryId: dto.categoryId,
          severity: dto.severity,
          sourceType: dto.sourceType,
          checkpointId: dto.checkpointId,
          regionId: dto.regionId,
          latitude:
            dto.latitude !== undefined
              ? new Prisma.Decimal(dto.latitude)
              : undefined,
          longitude:
            dto.longitude !== undefined
              ? new Prisma.Decimal(dto.longitude)
              : undefined,
          occurredAt: new Date(dto.occurredAt),
          reportedByUserId: currentUserId,
          status: IncidentStatus.open,
        },
        include: {
          category: true,
          region: true,
          checkpoint: true,
        },
      });

      await this.appendStatusHistory(tx, {
        incidentId: created.id,
        oldStatus: IncidentStatus.open,
        newStatus: IncidentStatus.open,
        changedByUserId: currentUserId,
        reason: 'Initial status on creation',
      });

      return created;
    });

    return incident;
  }

  /**
   * findAll
   * -------
   * Retrieves a paginated list of incidents.
   *
   * Supports:
   * - Filtering by status
   * - Filtering by severity
   * - Filtering by category
   * - Filtering by region
   * - Filtering by checkpoint
   * - Filtering by source type
   * - Filtering by occurredAt date range
   * - Sorting by a selected field
   * - Pagination using page and limit
   *
   * @param query - Query parameters for filtering, sorting, and pagination
   * @returns An object containing:
   * - data: list of incidents
   * - meta: pagination information
   */
  async findAll(query: ListIncidentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.IncidentWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.category) where.categoryId = query.category;
    if (query.region) where.regionId = query.region;
    if (query.checkpoint) where.checkpointId = query.checkpoint;
    if (query.sourceType) where.sourceType = query.sourceType;

    if (query.dateFrom || query.dateTo) {
      where.occurredAt = {};
      if (query.dateFrom) {
        where.occurredAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.occurredAt.lte = new Date(query.dateTo);
      }
    }

    const orderBy: Prisma.IncidentOrderByWithRelationInput = {
      [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.incident.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          region: true,
          checkpoint: true,
          reportedByUser: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          verifiedByUser: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          closedByUser: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * update
   * ------
   * Updates the general details of an existing incident.
   *
   * This may include:
   * - title
   * - description
   * - category
   * - severity
   * - sourceType
   * - region
   * - checkpoint
   * - latitude
   * - longitude
   * - occurredAt
   *
   * If category, region, or checkpoint IDs are provided,
   * the method validates their existence before updating.
   *
   * @param id - Unique identifier of the incident
   * @param dto - Updated incident fields
   * @returns The updated incident with category, region, and checkpoint
   * @throws NotFoundException if the incident does not exist
   * @throws BadRequestException if referenced relations do not exist
   */
  async update(id: string, dto: UpdateIncidentDto) {
    await this.findOne(id);

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    if (dto.regionId) {
      await this.ensureRegionExists(dto.regionId);
    }

    if (dto.checkpointId) {
      await this.ensureCheckpointExists(dto.checkpointId);
    }

    const data: Prisma.IncidentUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.categoryId !== undefined) {
      data.category = { connect: { id: dto.categoryId } };
    }
    if (dto.severity !== undefined) data.severity = dto.severity;
    if (dto.sourceType !== undefined) data.sourceType = dto.sourceType;
    if (dto.regionId !== undefined) {
      data.region = { connect: { id: dto.regionId } };
    }
    if (dto.checkpointId !== undefined) {
      data.checkpoint = { connect: { id: dto.checkpointId } };
    }
    if (dto.latitude !== undefined) {
      data.latitude = new Prisma.Decimal(dto.latitude);
    }
    if (dto.longitude !== undefined) {
      data.longitude = new Prisma.Decimal(dto.longitude);
    }
    if (dto.occurredAt !== undefined) {
      data.occurredAt = new Date(dto.occurredAt);
    }

    return this.prisma.incident.update({
      where: { id },
      data,
      include: {
        category: true,
        region: true,
        checkpoint: true,
      },
    });
  }

  /**
   * verify
   * ------
   * Marks an incident as verified.
   *
   * Only incidents with status "open" can be verified.
   *
   * Process:
   * 1. Ensures the incident exists
   * 2. Ensures the incident is currently open
   * 3. Updates the incident status to verified
   * 4. Stores verifier user and verification timestamp
   * 5. Adds a status history record
   *
   * @param id - Unique identifier of the incident
   * @param dto - Verification data including optional reason
   * @param currentUserId - ID of the authenticated user verifying the incident
   * @returns The updated incident
   * @throws BadRequestException if the incident is not open
   */
  async verify(id: string, dto: VerifyIncidentDto, currentUserId: string) {
    const incident = await this.findOne(id);

    if (incident.status !== IncidentStatus.open) {
      throw new BadRequestException('Only open incidents can be verified');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.incident.update({
        where: { id },
        data: {
          status: IncidentStatus.verified,
          verifiedByUserId: currentUserId,
          verifiedAt: new Date(),
        },
        include: {
          category: true,
          region: true,
          checkpoint: true,
        },
      });

      await this.appendStatusHistory(tx, {
        incidentId: id,
        oldStatus: incident.status,
        newStatus: IncidentStatus.verified,
        changedByUserId: currentUserId,
        reason: dto.reason,
      });

      return updated;
    });
  }

  /**
   * close
   * -----
   * Marks an incident as closed.
   *
   * Only incidents with status "open" or "verified"
   * can be closed.
   *
   * Process:
   * 1. Ensures the incident exists
   * 2. Ensures its current status is allowed for closing
   * 3. Updates the incident status to closed
   * 4. Stores closer user and closing timestamp
   * 5. Adds a status history record
   *
   * @param id - Unique identifier of the incident
   * @param dto - Closing data including optional reason
   * @param currentUserId - ID of the authenticated user closing the incident
   * @returns The updated incident
   * @throws BadRequestException if the incident cannot be closed
   */
  async close(id: string, dto: CloseIncidentDto, currentUserId: string) {
    const incident = await this.findOne(id);

    if (
      incident.status !== IncidentStatus.open &&
      incident.status !== IncidentStatus.verified
    ) {
      throw new BadRequestException(
        'Only open or verified incidents can be closed',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.incident.update({
        where: { id },
        data: {
          status: IncidentStatus.closed,
          closedByUserId: currentUserId,
          closedAt: new Date(),
        },
        include: {
          category: true,
          region: true,
          checkpoint: true,
        },
      });

      await this.appendStatusHistory(tx, {
        incidentId: id,
        oldStatus: incident.status,
        newStatus: IncidentStatus.closed,
        changedByUserId: currentUserId,
        reason: dto.reason,
      });

      return updated;
    });
  }

  /**
   * reject
   * ------
   * Marks an incident as rejected.
   *
   * Rules:
   * - Closed incidents cannot be rejected
   * - Already rejected incidents cannot be rejected again
   *
   * Process:
   * 1. Ensures the incident exists
   * 2. Validates that rejection is allowed
   * 3. Updates the incident status to rejected
   * 4. Adds a status history record
   *
   * @param id - Unique identifier of the incident
   * @param dto - Rejection data including optional reason
   * @param currentUserId - ID of the authenticated user rejecting the incident
   * @returns The updated incident
   * @throws BadRequestException if rejection is not allowed
   */
  async reject(id: string, dto: RejectIncidentDto, currentUserId: string) {
    const incident = await this.findOne(id);

    if (incident.status === IncidentStatus.closed) {
      throw new BadRequestException('Closed incidents cannot be rejected');
    }

    if (incident.status === IncidentStatus.rejected) {
      throw new BadRequestException('Incident already rejected');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.incident.update({
        where: { id },
        data: {
          status: IncidentStatus.rejected,
        },
        include: {
          category: true,
          region: true,
          checkpoint: true,
        },
      });

      await this.appendStatusHistory(tx, {
        incidentId: id,
        oldStatus: incident.status,
        newStatus: IncidentStatus.rejected,
        changedByUserId: currentUserId,
        reason: dto.reason,
      });

      return updated;
    });
  }

  /**
   * getStatusHistory
   * ----------------
   * Retrieves the status history of a specific incident.
   *
   * The results are ordered by most recent change first.
   *
   * It also includes selected details about
   * the user who performed each status change.
   *
   * @param id - Unique identifier of the incident
   * @returns A list of incident status history records
   * @throws NotFoundException if the incident does not exist
   */
  async getStatusHistory(id: string) {
    await this.findOne(id);

    return this.prisma.incidentStatusHistory.findMany({
      where: { incidentId: id },
      orderBy: { changedAt: 'desc' },
      include: {
        changedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}