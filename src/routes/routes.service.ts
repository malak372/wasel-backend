import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EstimateRouteDto } from './dto/estimate-route.dto';
import { GetRoutesQueryDto } from './dto/get-routes-query.dto';
import { firstValueFrom } from 'rxjs';
import {
  CheckpointStatus,
  IncidentStatus,
  Prisma,
} from '@prisma/client';

type CurrentUserType = {
  userId: string;
  email: string;
  role: string;
};

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async estimateRoute(dto: EstimateRouteDto, user: CurrentUserType) {
    const startedAt = Date.now();

    const provider = this.configService.get<string>('ROUTING_PROVIDER') || 'osrm';
    const osrmBaseUrl =
      this.configService.get<string>('OSRM_BASE_URL') ||
      'https://router.project-osrm.org';

    const requestSummary = JSON.stringify({
      origin: dto.origin,
      destination: dto.destination,
      avoidCheckpoints: dto.avoidCheckpoints,
      avoidAreas: dto.avoidAreas ?? [],
    });

    try {
      const routingResult = await this.callRoutingProvider(
        provider,
        osrmBaseUrl,
        dto,
      );

      const minLat = Math.min(dto.origin.lat, dto.destination.lat) - 0.1;
      const maxLat = Math.max(dto.origin.lat, dto.destination.lat) + 0.1;
      const minLng = Math.min(dto.origin.lng, dto.destination.lng) - 0.1;
      const maxLng = Math.max(dto.origin.lng, dto.destination.lng) + 0.1;

      const nearbyCheckpoints = await this.prisma.checkpoint.findMany({
        where: {
          latitude: {
            gte: new Prisma.Decimal(minLat),
            lte: new Prisma.Decimal(maxLat),
          },
          longitude: {
            gte: new Prisma.Decimal(minLng),
            lte: new Prisma.Decimal(maxLng),
          },
          currentStatus: {
            in: [CheckpointStatus.delayed, CheckpointStatus.closed],
          },
        },
        include: {
          region: true,
        },
      });

      const verifiedIncidents = await this.prisma.incident.findMany({
        where: {
          status: IncidentStatus.verified,
          latitude: {
            gte: new Prisma.Decimal(minLat),
            lte: new Prisma.Decimal(maxLat),
          },
          longitude: {
            gte: new Prisma.Decimal(minLng),
            lte: new Prisma.Decimal(maxLng),
          },
        },
        include: {
          category: true,
          region: true,
          checkpoint: true,
        },
      });

      const matchedAvoidRegions = await this.resolveAvoidAreas(dto.avoidAreas);

      const matchedAvoidRegionIds = new Set(matchedAvoidRegions.map((r) => r.id));

      const checkpointsInAvoidAreas = nearbyCheckpoints.filter(
        (checkpoint) =>
          checkpoint.regionId && matchedAvoidRegionIds.has(checkpoint.regionId),
      );

      const incidentsInAvoidAreas = verifiedIncidents.filter(
        (incident) => incident.regionId && matchedAvoidRegionIds.has(incident.regionId),
      );

      let adjustedDistanceKm = routingResult.distanceKm;
      let adjustedDurationMin = routingResult.durationMin;

      const notes: string[] = [];

      if (dto.avoidCheckpoints && nearbyCheckpoints.length > 0) {
        adjustedDurationMin += nearbyCheckpoints.length * 7;
        adjustedDistanceKm += nearbyCheckpoints.length * 1.5;
        notes.push(
          `Route adjusted logically to avoid ${nearbyCheckpoints.length} affected checkpoint(s).`,
        );
      }

      if (matchedAvoidRegions.length > 0) {
        adjustedDurationMin += matchedAvoidRegions.length * 10;
        adjustedDistanceKm += matchedAvoidRegions.length * 2;
        notes.push(
          `Route adjusted logically for ${matchedAvoidRegions.length} avoid area(s).`,
        );
      }

      if (verifiedIncidents.length > 0) {
        adjustedDurationMin += verifiedIncidents.length * 4;
        notes.push(
          `Route impacted by ${verifiedIncidents.length} verified incident(s).`,
        );
      }

      const metadata = {
        usedProvider: provider,
        providerRouteDistanceKm: routingResult.distanceKm,
        providerRouteDurationMin: routingResult.durationMin,
        affectedByCheckpointCount: nearbyCheckpoints.length,
        affectedByIncidentCount: verifiedIncidents.length,
        avoidAreasMatchedCount: matchedAvoidRegions.length,
        checkpointsInsideAvoidAreasCount: checkpointsInAvoidAreas.length,
        incidentsInsideAvoidAreasCount: incidentsInAvoidAreas.length,
        weatherConsidered: false,
        notes,
      };

      const createdRoute = await this.prisma.route.create({
        data: {
          originName: dto.origin.name,
          originLat: new Prisma.Decimal(dto.origin.lat),
          originLng: new Prisma.Decimal(dto.origin.lng),
          destinationName: dto.destination.name,
          destinationLat: new Prisma.Decimal(dto.destination.lat),
          destinationLng: new Prisma.Decimal(dto.destination.lng),
          estimatedDistanceKm: new Prisma.Decimal(adjustedDistanceKm.toFixed(2)),
          estimatedDurationMin: Math.round(adjustedDurationMin),
          avoidCheckpoints: {
            requested: dto.avoidCheckpoints,
            affectedCheckpoints: nearbyCheckpoints.map((c) => ({
              id: c.id,
              name: c.name,
              status: c.currentStatus,
              region: c.region?.name ?? null,
            })),
          },
          avoidAreas: matchedAvoidRegions.map((region) => ({
            id: region.id,
            name: region.name,
            regionType: region.regionType,
          })),
          metadataJson: metadata,
          createdByUserId: user.userId,
        },
      });

      await this.prisma.externalApiLog.create({
        data: {
          providerName: provider,
          endpoint: 'route-estimate',
          requestSummary,
          responseStatus: 200,
          responseTimeMs: Date.now() - startedAt,
          cached: false,
        },
      });

      return {
        id: createdRoute.id,
        origin: dto.origin,
        destination: dto.destination,
        estimatedDistanceKm: Number(adjustedDistanceKm.toFixed(2)),
        estimatedDurationMin: Math.round(adjustedDurationMin),
        metadata,
        affectingCheckpoints: nearbyCheckpoints.map((checkpoint) => ({
          id: checkpoint.id,
          name: checkpoint.name,
          status: checkpoint.currentStatus,
          region: checkpoint.region?.name ?? null,
        })),
        affectingIncidents: verifiedIncidents.map((incident) => ({
          id: incident.id,
          title: incident.title,
          severity: incident.severity,
          category: incident.category.name,
          region: incident.region?.name ?? null,
          checkpoint: incident.checkpoint?.name ?? null,
        })),
        avoidAreasApplied: matchedAvoidRegions.map((region) => ({
          id: region.id,
          name: region.name,
          regionType: region.regionType,
        })),
      };
    } catch (error) {
      await this.prisma.externalApiLog.create({
        data: {
          providerName: provider,
          endpoint: 'route-estimate',
          requestSummary,
          responseStatus: 500,
          responseTimeMs: Date.now() - startedAt,
          cached: false,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown routing error',
        },
      });

      throw error;
    }
  }

  async findAll(user: CurrentUserType, query: GetRoutesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.route.findMany({
        where: {
          createdByUserId: user.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.route.count({
        where: {
          createdByUserId: user.userId,
        },
      }),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: items.map((route) => ({
        id: route.id,
        originName: route.originName,
        destinationName: route.destinationName,
        estimatedDistanceKm:
          route.estimatedDistanceKm !== null
            ? Number(route.estimatedDistanceKm)
            : null,
        estimatedDurationMin: route.estimatedDurationMin,
        avoidCheckpoints: route.avoidCheckpoints,
        avoidAreas: route.avoidAreas,
        metadata: route.metadataJson,
        createdAt: route.createdAt,
      })),
    };
  }

  async findOne(id: string, user: CurrentUserType) {
    const route = await this.prisma.route.findFirst({
      where: {
        id,
        createdByUserId: user.userId,
      },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return {
      id: route.id,
      origin: {
        name: route.originName,
        lat: Number(route.originLat),
        lng: Number(route.originLng),
      },
      destination: {
        name: route.destinationName,
        lat: Number(route.destinationLat),
        lng: Number(route.destinationLng),
      },
      estimatedDistanceKm:
        route.estimatedDistanceKm !== null
          ? Number(route.estimatedDistanceKm)
          : null,
      estimatedDurationMin: route.estimatedDurationMin,
      avoidCheckpoints: route.avoidCheckpoints,
      avoidAreas: route.avoidAreas,
      metadata: route.metadataJson,
      createdAt: route.createdAt,
    };
  }

  private async callRoutingProvider(
    provider: string,
    osrmBaseUrl: string,
    dto: EstimateRouteDto,
  ) {
    if (provider !== 'osrm') {
      throw new BadGatewayException('Unsupported routing provider');
    }

    const url =
      `${osrmBaseUrl}/route/v1/driving/` +
      `${dto.origin.lng},${dto.origin.lat};${dto.destination.lng},${dto.destination.lat}` +
      `?overview=false&steps=false&annotations=false`;

    const response = await firstValueFrom(this.httpService.get(url));
    const data = response.data;

    if (!data?.routes?.length) {
      throw new BadGatewayException('Routing provider returned no route');
    }

    const route = data.routes[0];

    return {
  distanceKm: route.distance / 1000,
  durationMin: Math.round(route.duration / 60),
};
  }

  private async resolveAvoidAreas(avoidAreas?: string[]) {
    if (!avoidAreas || avoidAreas.length === 0) {
      return [];
    }

    const normalized = avoidAreas.map((item) => item.trim()).filter(Boolean);

    const regions = await this.prisma.region.findMany({
      where: {
        OR: [
          {
            id: {
              in: normalized,
            },
          },
          {
            name: {
              in: normalized,
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    return regions;
  }
}