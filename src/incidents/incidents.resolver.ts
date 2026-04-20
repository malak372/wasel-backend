import { Resolver, Query, ObjectType, Field, ID, Float, Args } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';

/**
 * IncidentType
 * ------------
 * Author: Rahaf
 *
 * GraphQL object type representing an incident entity.
 *
 * This type is used to expose incident data through GraphQL queries.
 * It includes key fields related to incident details, location, and timing.
 *
 * Fields:
 * - id: Unique identifier of the incident
 * - title: Short title describing the incident
 * - description: Detailed description of the incident (optional)
 * - severity: Severity level (low, medium, high, critical)
 * - status: Current status (open, verified, closed, etc.)
 * - latitude: Geographic latitude (optional)
 * - longitude: Geographic longitude (optional)
 * - occurredAt: Timestamp when the incident occurred
 */
@ObjectType()
class IncidentType {
  @Field(() => ID) id: string;
  @Field() title: string;
  @Field({ nullable: true }) description: string;
  @Field() severity: string;
  @Field() status: string;
  @Field(() => Float, { nullable: true }) latitude: number;
  @Field(() => Float, { nullable: true }) longitude: number;
  @Field() occurredAt: Date;
}

/**
 * IncidentsResolver
 * -----------------
 * Author: Rahaf
 *
 * GraphQL resolver responsible for handling read-only queries
 * related to incidents.
 *
 * This resolver provides:
 * - Fetching all incidents with optional filters
 * - Fetching recent incidents
 * - Fetching a single incident by ID
 *
 * Notes:
 * - Only query operations are implemented (no mutations)
 * - PrismaService is used for database interaction
 * - Part of the GraphQL bonus feature
 */
@Resolver(() => IncidentType)
export class IncidentsResolver {

  /**
   * Constructor
   * -----------
   * Injects PrismaService for database access.
   *
   * @param prisma - Prisma client used for querying incident data
   */
  constructor(private prisma: PrismaService) {}

  /**
   * incidents
   * ---------
   * Retrieves a list of incidents with optional filtering and sorting.
   *
   * Filters:
   * - status: Filter incidents by their current status
   * - regionId: Filter incidents by region
   *
   * Additional Behavior:
   * - If "recent" is true:
   *   - Sorts incidents by occurrence time (latest first)
   *   - Limits results to the latest 10 records
   *
   * @param status - Optional incident status filter
   * @param regionId - Optional region filter
   * @param recent - Flag to return only recent incidents
   * @returns Array of incident objects
   */
  @Query(() => [IncidentType])
  async incidents(
    @Args('status', { nullable: true }) status?: string,
    @Args('regionId', { nullable: true }) regionId?: string,
    @Args('recent', { nullable: true, defaultValue: false }) recent?: boolean,
  ) {
    return await this.prisma.incident.findMany({
      where: {
        AND: [
          status ? { status: status as any } : {},
          regionId ? { regionId: regionId } : {},
        ],
      },
      // If "recent" is true, return latest incidents first and limit results
      orderBy: recent ? { occurredAt: 'desc' } : undefined,
      take: recent ? 10 : undefined,
    });
  }

  /**
   * incident
   * --------
   * Retrieves a single incident by its unique identifier.
   *
   * Behavior:
   * - Searches for an incident using its ID
   * - Returns null if the incident does not exist
   *
   * @param id - Incident ID
   * @returns Incident object or null
   */
  @Query(() => IncidentType, { nullable: true })
  async incident(@Args('id', { type: () => ID }) id: string) {
    return await this.prisma.incident.findUnique({ where: { id: id } });
  }
}