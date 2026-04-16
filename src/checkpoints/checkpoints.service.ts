import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, CheckpointStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { UpdateCheckpointStatusDto } from './dto/update-checkpoint-status.dto';
import { ListCheckpointsQueryDto } from './dto/list-checkpoints-query.dto';

/**
 * CheckpointsService
 * ------------------
 * Author: Eman
 *
 * This service contains the business logic for managing checkpoints
 * in the application.
 *
 * It is responsible for:
 * - Creating new checkpoints
 * - Retrieving checkpoints with filtering, sorting, and pagination
 * - Retrieving a single checkpoint by ID
 * - Updating checkpoint details
 * - Deleting checkpoints
 * - Updating checkpoint status
 * - Retrieving checkpoint status history
 *
 * It also ensures:
 * - The referenced region exists before creation or update
 * - Status history is recorded whenever a checkpoint is created
 *   or its status changes
 * - Proper exceptions are thrown when invalid operations occur
 *
 * Dependencies:
 * - PrismaService: Used for database operations
 * - Prisma Client types: Used for typed queries and decimal handling
 */
@Injectable()
export class CheckpointsService {
  /**
   * Constructor
   * -----------
   * Injects PrismaService to handle database operations.
   *
   * @param prisma - Prisma service used to interact with the database
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ensureRegionExists
   * ------------------
   * Verifies that a region with the given ID exists in the database.
   *
   * This method is used before creating or updating a checkpoint
   * to ensure the referenced region is valid.
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
   * appendStatusHistory
   * -------------------
   * Creates a new status history record for a checkpoint.
   *
   * This helper method centralizes the logic for saving
   * checkpoint status history in order to avoid code duplication.
   *
   * @param tx - Prisma transaction client used during transactional operations
   * @param params - Object containing status history data
   * @param params.checkpointId - Unique identifier of the checkpoint
   * @param params.status - New checkpoint status
   * @param params.changedByUserId - ID of the user who changed the status
   * @param params.note - Optional note explaining the status change
   * @returns The created checkpoint status history record
   */
  private async appendStatusHistory(
    tx: Prisma.TransactionClient,
    params: {
      checkpointId: string;
      status: CheckpointStatus;
      changedByUserId?: string | null;
      note?: string;
    },
  ) {
    return tx.checkpointStatusHistory.create({
      data: {
        checkpointId: params.checkpointId,
        status: params.status,
        changedByUserId: params.changedByUserId ?? null,
        note: params.note,
      },
    });
  }

  /**
   * create
   * ------
   * Creates a new checkpoint in the database.
   *
   * Process:
   * 1. Ensures the referenced region exists
   * 2. Determines the initial status
   * 3. Creates the checkpoint
   * 4. Adds an initial status history record
   *
   * A database transaction is used to ensure both the checkpoint
   * creation and the history record are saved together.
   *
   * @param dto - Data transfer object containing checkpoint creation data
   * @param currentUserId - ID of the authenticated user creating the checkpoint
   * @returns The newly created checkpoint with its associated region
   */
  async create(dto: CreateCheckpointDto, currentUserId: string) {
    await this.ensureRegionExists(dto.regionId);

    const status = dto.currentStatus ?? CheckpointStatus.unknown;

    const checkpoint = await this.prisma.$transaction(async (tx) => {
      const created = await tx.checkpoint.create({
        data: {
          name: dto.name,
          latitude: new Prisma.Decimal(dto.latitude),
          longitude: new Prisma.Decimal(dto.longitude),
          regionId: dto.regionId,
          description: dto.description,
          currentStatus: status,
        },
        include: {
          region: true,
        },
      });

      await this.appendStatusHistory(tx, {
        checkpointId: created.id,
        status,
        changedByUserId: currentUserId,
        note: 'Initial status on creation',
      });

      return created;
    });

    return checkpoint;
  }

  /**
   * findAll
   * -------
   * Retrieves a paginated list of checkpoints.
   *
   * Supports:
   * - Filtering by status
   * - Filtering by region
   * - Searching by checkpoint name
   * - Sorting by a selected field
   * - Pagination using page and limit
   *
   * @param query - Query object containing filters, sorting, and pagination options
   * @returns An object containing:
   * - data: list of checkpoints
   * - meta: pagination details
   */
  async findAll(query: ListCheckpointsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CheckpointWhereInput = {};

    if (query.status) {
      where.currentStatus = query.status;
    }

    if (query.region) {
      where.regionId = query.region;
    }

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const orderBy: Prisma.CheckpointOrderByWithRelationInput = {
      [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.checkpoint.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          region: true,
        },
      }),
      this.prisma.checkpoint.count({ where }),
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
   * findOne
   * -------
   * Retrieves a single checkpoint by its unique identifier.
   *
   * Includes the related region data in the response.
   *
   * @param id - Unique identifier of the checkpoint
   * @returns The checkpoint with region information
   * @throws NotFoundException if the checkpoint does not exist
   */
  async findOne(id: string) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id },
      include: {
        region: true,
      },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    return checkpoint;
  }

  /**
   * update
   * ------
   * Updates the general details of an existing checkpoint.
   *
   * This may include:
   * - Name
   * - Description
   * - Region
   * - Latitude
   * - Longitude
   *
   * If a new region ID is provided, the method ensures
   * that the referenced region exists before updating.
   *
   * @param id - Unique identifier of the checkpoint to update
   * @param dto - Data transfer object containing updated checkpoint fields
   * @returns The updated checkpoint with region information
   * @throws NotFoundException if the checkpoint does not exist
   * @throws BadRequestException if the provided region does not exist
   */
  async update(id: string, dto: UpdateCheckpointDto) {
    await this.findOne(id);

    if (dto.regionId) {
      await this.ensureRegionExists(dto.regionId);
    }

    const data: Prisma.CheckpointUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.regionId !== undefined) {
      data.region = { connect: { id: dto.regionId } };
    }
    if (dto.latitude !== undefined) {
      data.latitude = new Prisma.Decimal(dto.latitude);
    }
    if (dto.longitude !== undefined) {
      data.longitude = new Prisma.Decimal(dto.longitude);
    }

    return this.prisma.checkpoint.update({
      where: { id },
      data,
      include: {
        region: true,
      },
    });
  }

  /**
   * remove
   * ------
   * Deletes a checkpoint from the database.
   *
   * The method first ensures the checkpoint exists
   * before attempting deletion.
   *
   * @param id - Unique identifier of the checkpoint to delete
   * @returns A success message confirming deletion
   * @throws NotFoundException if the checkpoint does not exist
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.checkpoint.delete({
      where: { id },
    });

    return {
      message: 'Checkpoint deleted successfully',
    };
  }

  /**
   * updateStatus
   * ------------
   * Updates the current status of a checkpoint.
   *
   * Process:
   * 1. Ensures the checkpoint exists
   * 2. Prevents updating to the same status
   * 3. Updates the checkpoint status
   * 4. Records the status change in checkpoint status history
   *
   * A database transaction is used to ensure both
   * the status update and the history creation
   * happen together.
   *
   * @param id - Unique identifier of the checkpoint
   * @param dto - Data transfer object containing the new status and optional note
   * @param currentUserId - ID of the authenticated user performing the status update
   * @returns The updated checkpoint with region information
   * @throws NotFoundException if the checkpoint does not exist
   * @throws BadRequestException if the checkpoint already has the same status
   */
  async updateStatus(
    id: string,
    dto: UpdateCheckpointStatusDto,
    currentUserId: string,
  ) {
    const checkpoint = await this.findOne(id);

    if (checkpoint.currentStatus === dto.status) {
      throw new BadRequestException('Checkpoint already has this status');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const checkpointUpdated = await tx.checkpoint.update({
        where: { id },
        data: {
          currentStatus: dto.status,
        },
        include: {
          region: true,
        },
      });

      await this.appendStatusHistory(tx, {
        checkpointId: id,
        status: dto.status,
        changedByUserId: currentUserId,
        note: dto.note,
      });

      return checkpointUpdated;
    });

    return updated;
  }

  /**
   * getStatusHistory
   * ----------------
   * Retrieves the full status change history of a checkpoint.
   *
   * The results are ordered by change date in descending order,
   * so the most recent status changes appear first.
   *
   * It also includes selected information about the user
   * who made each status change.
   *
   * @param id - Unique identifier of the checkpoint
   * @returns A list of checkpoint status history records
   * @throws NotFoundException if the checkpoint does not exist
   */
  async getStatusHistory(id: string) {
    await this.findOne(id);

    return this.prisma.checkpointStatusHistory.findMany({
      where: { checkpointId: id },
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