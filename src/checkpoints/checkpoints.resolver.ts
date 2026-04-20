import { Resolver, Query, ObjectType, Field, ID, Float, Args } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';

/**
 * CheckpointType
 * --------------
 * Author: Rahaf
 *
 * GraphQL object type representing a checkpoint entity.
 *
 * This type is used to expose checkpoint data through GraphQL queries.
 * It includes core fields required for read-only operations.
 *
 * Fields:
 * - id: Unique identifier of the checkpoint
 * - name: Name of the checkpoint
 * - currentStatus: Current operational status (open, closed, delayed, etc.)
 * - latitude: Geographic latitude coordinate
 * - longitude: Geographic longitude coordinate
 */
@ObjectType()
class CheckpointType {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() currentStatus: string;
  @Field(() => Float) latitude: number;
  @Field(() => Float) longitude: number;
}

/**
 * CheckpointsResolver
 * -------------------
 * Author: Rahaf
 *
 * GraphQL resolver responsible for handling read-only queries
 * related to checkpoints.
 *
 * This resolver provides:
 * - Fetching all checkpoints with optional filtering
 * - Fetching a single checkpoint by ID
 *
 * Notes:
 * - Only query operations are implemented (no mutations)
 * - PrismaService is used for database interaction
 * - Part of the GraphQL bonus feature
 */
@Resolver(() => CheckpointType)
export class CheckpointsResolver {

  /**
   * Constructor
   * -----------
   * Injects PrismaService for database access.
   *
   * @param prisma - Prisma client used for querying checkpoint data
   */
  constructor(private prisma: PrismaService) {}

  /**
   * checkpoints
   * -----------
   * Retrieves a list of checkpoints with optional filtering.
   *
   * Filters:
   * - status: Filter checkpoints by current status
   * - name: Filter checkpoints by partial name match (case-insensitive)
   *
   * Behavior:
   * - Applies conditional filters only when arguments are provided
   * - Uses Prisma findMany to retrieve matching records
   *
   * @param status - Optional checkpoint status filter
   * @param name - Optional checkpoint name filter
   * @returns Array of checkpoint objects
   */
  @Query(() => [CheckpointType])
  async checkpoints(
    @Args('status', { nullable: true }) status?: string,
    @Args('name', { nullable: true }) name?: string,
  ) {
    return await this.prisma.checkpoint.findMany({
      where: {
        AND: [
          status ? { currentStatus: status as any } : {},
          name ? { name: { contains: name, mode: 'insensitive' } } : {},
        ],
      },
    });
  }

  /**
   * checkpoint
   * ----------
   * Retrieves a single checkpoint by its unique identifier.
   *
   * Behavior:
   * - Searches for a checkpoint using its ID
   * - Returns null if no checkpoint is found
   *
   * @param id - Checkpoint ID
   * @returns Checkpoint object or null
   */
  @Query(() => CheckpointType, { nullable: true })
  async checkpoint(@Args('id', { type: () => ID }) id: string) {
    return await this.prisma.checkpoint.findUnique({ where: { id: id } });
  }
}