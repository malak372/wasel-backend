import { Resolver, Query, ObjectType, Field, ID, Float, Args } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';

/**
 * CitizenReportType
 * -----------------
 * Author: Rahaf
 *
 * GraphQL object type representing a simplified view of a citizen report.
 *
 * This type is used in GraphQL queries to expose selected report fields
 * to clients without returning the full database model.
 *
 * Fields:
 * - id: Unique identifier of the report
 * - description: Report description provided by the user
 * - status: Current report status (pending, approved, etc.)
 * - userId: ID of the user who submitted the report (optional)
 * - confidenceScore: Calculated reliability score (optional)
 * - reportTime: Timestamp when the report was created
 */
@ObjectType()
class CitizenReportType {
  @Field(() => ID) id: string;
  @Field() description: string;
  @Field() status: string;
  @Field(() => ID, { nullable: true }) userId: string;
  @Field(() => Float, { nullable: true }) confidenceScore: number;
  @Field() reportTime: Date;
}

/**
 * ReportsResolver
 * ---------------
 * Author: Rahaf
 *
 * GraphQL resolver responsible for handling read-only queries
 * related to citizen reports.
 *
 * This resolver is part of the GraphQL bonus feature and provides:
 * - Fetching all reports with optional filters
 * - Fetching a single report by ID
 *
 * Notes:
 * - Only read operations (queries) are implemented
 * - No mutations are included as per project requirements
 * - PrismaService is used for direct database access
 */
@Resolver(() => CitizenReportType)
export class ReportsResolver {

  /**
   * Constructor
   * -----------
   * Injects PrismaService for database operations.
   *
   * @param prisma - Prisma client used to query the database
   */
  constructor(private prisma: PrismaService) {}

  /**
   * reports
   * -------
   * Retrieves a list of citizen reports with optional filtering.
   *
   * Filters:
   * - status: Filter reports by their current status
   * - userId: Filter reports by the submitting user
   *
   * Behavior:
   * - Applies conditional filtering based on provided arguments
   * - Returns all matching reports
   *
   * @param status - Optional report status filter
   * @param userId - Optional user ID filter
   * @returns Array of citizen reports
   */
  @Query(() => [CitizenReportType])
  async reports(
    @Args('status', { nullable: true }) status?: string,
    @Args('userId', { nullable: true }) userId?: string,
  ) {
    return await this.prisma.citizenReport.findMany({
      where: {
        AND: [
          status ? { status: status as any } : {},
          userId ? { userId: userId } : {},
        ],
      },
    });
  }

  /**
   * report
   * ------
   * Retrieves a single citizen report by its ID.
   *
   * Behavior:
   * - Searches for a report using its unique identifier
   * - Returns null if the report does not exist
   *
   * @param id - Report ID
   * @returns Citizen report or null
   */
  @Query(() => CitizenReportType, { nullable: true })
  async report(@Args('id', { type: () => ID }) id: string) {
    return await this.prisma.citizenReport.findUnique({ where: { id: id } });
  }
}