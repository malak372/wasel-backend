import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * ReportType
 * ----------
 * Author: Rahaf
 *
 * GraphQL object type representing a simplified report structure.
 *
 * This type is used to expose report data through GraphQL queries.
 * It contains only basic fields required for lightweight responses.
 *
 * Fields:
 * - id: Unique identifier of the report
 * - category: Category of the report (e.g., delay, accident)
 * - description: Description provided for the report
 *
 * Notes:
 * - This is a simplified type and does not include relational data
 * - Used mainly for basic queries or testing GraphQL functionality
 */
@ObjectType()
export class ReportType {

  /**
   * Unique identifier of the report.
   */
  @Field(() => Int)
  id: number;

  /**
   * Category of the report.
   */
  @Field()
  category: string;

  /**
   * Description of the report.
   */
  @Field()
  description: string;
}