import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EstimateRouteDto } from './dto/estimate-route.dto';
import { GetRoutesQueryDto } from './dto/get-routes-query.dto';
import { firstValueFrom, timeout, retry, catchError, of } from 'rxjs';
import { CheckpointStatus, IncidentStatus, Prisma } from '@prisma/client';

/**
 * CurrentUserType
 * ---------------
 * Author: Eman
 *
 * Represents the authenticated user data
 * passed to route service methods.
 */
type CurrentUserType = {
  userId: string;
  email: string;
  role: string;
};

/**
 * RoutesService
 * -------------
 * Author: Eman
 *
 * Service responsible for route estimation and route retrieval.
 *
 * Main Responsibilities:
 * - Estimate routes between origin and destination.
 * - Integrate with external routing provider (OSRM).
 * - Optionally fetch weather data for the destination.
 * - Consider affected checkpoints and verified incidents.
 * - Resolve avoid areas based on region names or IDs.
 * - Store estimated routes in the database.
 * - Retrieve route history for the authenticated user.
 * - Log external API calls for monitoring purposes.
 */
@Injectable()
export class RoutesService {

  /**
   * logger
   * ------
   * Used for internal logging inside the service.
   */
  private readonly logger = new Logger(RoutesService.name);

  /**
   * weatherCache
   * ------------
   * In-memory cache used to temporarily store weather responses.
   *
   * Cache Structure:
   * - key: string representing latitude and longitude
   * - value: cached weather data with expiry timestamp
   */
  private weatherCache = new Map<string, { data: any; expiry: number }>();

  /**
   * constructor
   * -----------
   * Injects required dependencies for database access,
   * external HTTP requests, and application configuration.
   *
   * @param prisma Database service used for Prisma queries.
   * @param httpService HTTP client used for external API calls.
   * @param configService Configuration service used for environment variables.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * estimateRoute
   * -------------
   * Estimates a route between origin and destination.
   *
   * This method:
   * - Calls the routing provider to get a base route estimate.
   * - Fetches weather information for the destination.
   * - Finds nearby delayed/closed checkpoints.
   * - Finds nearby verified incidents.
   * - Resolves avoid areas provided by the user.
   * - Adjusts estimated distance and duration logically.
   * - Stores the created route in the database.
   * - Logs external API activity.
   *
   * @param dto DTO containing origin, destination, and route preferences.
   * @param user Authenticated user requesting the route.
   *
   * @returns An object containing:
   * - route ID
   * - route summary
   * - estimated distance and duration
   * - weather information
   * - metadata
   * - affecting checkpoints and incidents
   * - applied avoid areas
   *
   * @throws BadGatewayException if the routing provider fails.
   * @throws Error if any unexpected issue happens during estimation.
   */
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

      const weatherData = await this.getWeather(dto.destination.lat, dto.destination.lng);

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

      if (weatherData && ['Rain', 'Snow', 'Thunderstorm'].includes(weatherData.main)) {
        adjustedDurationMin += 15;
        notes.push(`Weather Condition (${weatherData.main}): Expected delays due to bad weather. Added 15 mins.`);
      }

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

      /**
       * metadata
       * --------
       * Stores additional technical and contextual information
       * about the generated route estimate.
       */
      const metadata = {
        usedProvider: provider,
        providerRouteDistanceKm: routingResult.distanceKm,
        providerRouteDurationMin: routingResult.durationMin,
        affectedByCheckpointCount: nearbyCheckpoints.length,
        affectedByIncidentCount: verifiedIncidents.length,
        avoidAreasMatchedCount: matchedAvoidRegions.length,
        checkpointsInsideAvoidAreasCount: checkpointsInAvoidAreas.length,
        incidentsInsideAvoidAreasCount: incidentsInAvoidAreas.length,
        weatherConsidered: !!weatherData,
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

      await this.logExternalApi(
        provider,
        'route-estimate',
        requestSummary,
        200,
        Date.now() - startedAt,
        false
      );

      return {
        id: createdRoute.id,
        origin: dto.origin,
        destination: dto.destination,
        estimatedDistanceKm: Number(adjustedDistanceKm.toFixed(2)),
        estimatedDurationMin: Math.round(adjustedDurationMin),
        weather: weatherData,
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
      await this.logExternalApi(
        provider,
        'route-estimate',
        requestSummary,
        500,
        Date.now() - startedAt,
        false,
        error instanceof Error ? error.message : 'Unknown routing error'
      );

      throw error;
    }
  }

  /**
   * findAll
   * -------
   * Retrieves all routes created by the authenticated user
   * with pagination support.
   *
   * @param user Authenticated user.
   * @param query Query DTO containing page and limit values.
   *
   * @returns Paginated route history including:
   * - page number
   * - limit
   * - total records
   * - total pages
   * - route data
   */
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

  /**
   * findOne
   * -------
   * Retrieves one specific route by its ID
   * for the authenticated user only.
   *
   * @param id Route ID.
   * @param user Authenticated user.
   *
   * @returns Detailed route information.
   *
   * @throws NotFoundException if the route does not exist
   * or does not belong to the authenticated user.
   */
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

  /**
   * callRoutingProvider
   * -------------------
   * Calls the configured external routing provider
   * to estimate distance and duration.
   *
   * Current Supported Provider:
   * - OSRM
   *
   * Features:
   * - 5 seconds timeout
   * - 1 retry attempt
   *
   * @param provider Provider name.
   * @param osrmBaseUrl Base URL of the OSRM service.
   * @param dto Route estimation DTO.
   *
   * @returns Base route estimate including:
   * - distance in kilometers
   * - duration in minutes
   *
   * @throws BadGatewayException if provider is unsupported
   * or if no route is returned.
   */
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

    const response = await firstValueFrom(
      this.httpService.get(url).pipe(
        timeout(5000),
        retry(1),
      )
    );
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

  /**
   * getWeather
   * ----------
   * Fetches weather information for a given latitude and longitude.
   *
   * Behavior:
   * - Returns null if WEATHER_API_KEY is not configured.
   * - Uses in-memory cache to reduce repeated API calls.
   * - Logs all external API interactions.
   *
   * @param lat Latitude of the destination.
   * @param lon Longitude of the destination.
   *
   * @returns Weather object containing:
   * - main weather condition
   * - description
   * - temperature
   *
   * Returns null if weather data is unavailable.
   */
  private async getWeather(lat: number, lon: number) {
    const apiKey = this.configService.get<string>('WEATHER_API_KEY');
    if (!apiKey) return null;

    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = this.weatherCache.get(cacheKey);

    const startedAt = Date.now();
    const providerName = 'OpenWeather';

    if (cached && cached.expiry > Date.now()) {
      await this.logExternalApi(providerName, 'weather', `Weather for ${lat},${lon}`, 200, Date.now() - startedAt, true);
      return cached.data;
    }

    const baseUrl = this.configService.get<string>('WEATHER_BASE_URL') || 'https://api.openweathermap.org/data/2.5/weather';
    const url = `${baseUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url).pipe(
          timeout(5000),
          catchError(() => of({ data: null }))
        )
      );

      if (response?.data) {
        const weatherData = {
          main: response.data.weather[0].main,
          description: response.data.weather[0].description,
          temp: response.data.main.temp,
        };

        this.weatherCache.set(cacheKey, { data: weatherData, expiry: Date.now() + 600000 });

        await this.logExternalApi(providerName, 'weather', `Weather for ${lat},${lon}`, 200, Date.now() - startedAt, false);
        return weatherData;
      }
      return null;
    } catch (e) {
      await this.logExternalApi(providerName, 'weather', `Weather for ${lat},${lon}`, 500, Date.now() - startedAt, false, (e as any).message);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';

      await this.logExternalApi(
        providerName,
        'weather',
        `Weather for ${lat},${lon}`,
        500,
        Date.now() - startedAt,
        false,
        errorMessage
      );
      this.logger.error('Weather API failed', e);
      return null;
    }
  }

  /**
   * logExternalApi
   * --------------
   * Stores an external API request log in the database.
   *
   * Logged Information:
   * - provider name
   * - endpoint
   * - request summary
   * - response status
   * - response time
   * - whether the response was cached
   * - optional error message
   *
   * @param providerName External API provider name.
   * @param endpoint Called endpoint name.
   * @param requestSummary Serialized request details.
   * @param responseStatus HTTP-like status code.
   * @param responseTimeMs Execution time in milliseconds.
   * @param cached Indicates whether cached data was used.
   * @param errorMessage Optional error message.
   */
  private async logExternalApi(
    providerName: string,
    endpoint: string,
    requestSummary: string,
    responseStatus: number,
    responseTimeMs: number,
    cached: boolean,
    errorMessage?: string
  ) {
    try {
      await this.prisma.externalApiLog.create({
        data: {
          providerName,
          endpoint,
          requestSummary,
          responseStatus,
          responseTimeMs,
          cached,
          errorMessage,
        },
      });
    } catch (err) {
      this.logger.error('Failed to log to ExternalApiLog', err);
    }
  }

  /**
   * resolveAvoidAreas
   * -----------------
   * Resolves the user-provided avoid areas into matching regions
   * from the database.
   *
   * Matching Rules:
   * - Match by region ID
   * - Match by region name (case-insensitive)
   *
   * @param avoidAreas Optional array of region IDs or names.
   *
   * @returns Array of matched regions.
   */
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