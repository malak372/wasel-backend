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

@Injectable()
export class CheckpointsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureRegionExists(regionId: string) {
    const region = await this.prisma.region.findUnique({
      where: { id: regionId },
    });

    if (!region) {
      throw new BadRequestException('Region not found');
    }

    return region;
  }

  private async appendStatusHistory(params: {
    checkpointId: string;
    status: CheckpointStatus;
    changedByUserId?: string | null;
    note?: string;
  }) {
    return this.prisma.checkpointStatusHistory.create({
      data: {
        checkpointId: params.checkpointId,
        status: params.status,
        changedByUserId: params.changedByUserId ?? null,
        note: params.note,
      },
    });
  }

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

      await tx.checkpointStatusHistory.create({
        data: {
          checkpointId: created.id,
          status,
          changedByUserId: currentUserId,
          note: 'Initial status on creation',
        },
      });

      return created;
    });

    return checkpoint;
  }

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

  async update(id: string, dto: UpdateCheckpointDto) {
    await this.findOne(id);

    if (dto.regionId) {
      await this.ensureRegionExists(dto.regionId);
    }

    const data: Prisma.CheckpointUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.regionId !== undefined) data.region = { connect: { id: dto.regionId } };
    if (dto.latitude !== undefined) data.latitude = new Prisma.Decimal(dto.latitude);
    if (dto.longitude !== undefined) data.longitude = new Prisma.Decimal(dto.longitude);

    return this.prisma.checkpoint.update({
      where: { id },
      data,
      include: {
        region: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.checkpoint.delete({
      where: { id },
    });

    return {
      message: 'Checkpoint deleted successfully',
    };
  }

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

      await tx.checkpointStatusHistory.create({
        data: {
          checkpointId: id,
          status: dto.status,
          changedByUserId: currentUserId,
          note: dto.note,
        },
      });

      return checkpointUpdated;
    });

    return updated;
  }

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