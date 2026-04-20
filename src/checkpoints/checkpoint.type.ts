import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * CheckpointType
 * --------------
 * Author: Eman
 *
 * GraphQL object type representing a simplified checkpoint entity.
 *
 * This type is used to expose checkpoint data through GraphQL queries.
 * It includes only essential fields required for basic read operations.
 *
 * Fields:
 * - id: Unique identifier of the checkpoint
 * - name: Name of the checkpoint
 * - status: Current operational status (e.g., open, closed, delayed)
 *
 * Notes:
 * - This is a simplified representation and does not include relations
 * - Designed for read-only GraphQL queries as part of the bonus feature
 */
@ObjectType()
export class CheckpointType {

  /**
   * Unique identifier of the checkpoint.
   */
  @Field(() => Int)
  id: number;

  /**
   * Name of the checkpoint.
   */
  @Field()
  name: string;

  /**
   * Current status of the checkpoint.
   */
  @Field()
  status: string;

}