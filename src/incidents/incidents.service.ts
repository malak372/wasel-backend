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

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.incidentCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException('Incident category not found');
    }

    return category;
  }

  private async ensureRegionExists(regionId: string) {
    const region = await this.prisma.region.findUnique({
      where: { id: regionId },
    });

    if (!region) {
      throw new BadRequestException('Region not found');
    }

    return region;
  }

  private async ensureCheckpointExists(checkpointId: string) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
    });

    if (!checkpoint) {
      throw new BadRequestException('Checkpoint not found');
    }

    return checkpoint;
  }

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
            dto.latitude !== undefined ? new Prisma.Decimal(dto.latitude) : undefined,
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

      await tx.incidentStatusHistory.create({
        data: {
          incidentId: created.id,
          oldStatus: IncidentStatus.open,
          newStatus: IncidentStatus.open,
          changedByUserId: currentUserId,
          reason: 'Initial status on creation',
        },
      });

      return created;
    });

    return incident;
  }

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
    if (dto.categoryId !== undefined) data.category = { connect: { id: dto.categoryId } };
    if (dto.severity !== undefined) data.severity = dto.severity;
    if (dto.sourceType !== undefined) data.sourceType = dto.sourceType;
    if (dto.regionId !== undefined) data.region = { connect: { id: dto.regionId } };
    if (dto.checkpointId !== undefined) {
      data.checkpoint = { connect: { id: dto.checkpointId } };
    }
    if (dto.latitude !== undefined) data.latitude = new Prisma.Decimal(dto.latitude);
    if (dto.longitude !== undefined) data.longitude = new Prisma.Decimal(dto.longitude);
    if (dto.occurredAt !== undefined) data.occurredAt = new Date(dto.occurredAt);

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

      await tx.incidentStatusHistory.create({
        data: {
          incidentId: id,
          oldStatus: incident.status,
          newStatus: IncidentStatus.verified,
          changedByUserId: currentUserId,
          reason: dto.reason,
        },
      });

      return updated;
    });
  }

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

      await tx.incidentStatusHistory.create({
        data: {
          incidentId: id,
          oldStatus: incident.status,
          newStatus: IncidentStatus.closed,
          changedByUserId: currentUserId,
          reason: dto.reason,
        },
      });

      return updated;
    });
  }

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

      await tx.incidentStatusHistory.create({
        data: {
          incidentId: id,
          oldStatus: incident.status,
          newStatus: IncidentStatus.rejected,
          changedByUserId: currentUserId,
          reason: dto.reason,
        },
      });

      return updated;
    });
  }

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