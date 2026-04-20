import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * GetRoutesQueryDto
 * -----------------
 * Author: Eman
 *
 * Data Transfer Object used for handling pagination
 * in route retrieval queries.
 *
 * This DTO allows clients to request routes in a paginated format
 * by specifying the page number and the number of records per page.
 *
 * Fields:
 * - page: Current page number (default = 1)
 * - limit: Number of items per page (default = 10, max = 100)
 *
 * Validation:
 * - page must be an integer greater than or equal to 1
 * - limit must be an integer between 1 and 100
 *
 * Notes:
 * - Used in GET /routes endpoint
 * - Ensures controlled pagination to avoid large data loads
 */
export class GetRoutesQueryDto {

  /**
   * Page number for pagination.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Number of records per page.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}