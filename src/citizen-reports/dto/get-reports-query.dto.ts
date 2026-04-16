import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * GetReportsQueryDto
 * ------------------
 * Author: Malak
 *
 * Data Transfer Object (DTO) used for filtering, sorting,
 * and paginating reports in query parameters.
 *
 * This DTO is designed for GET endpoints where reports
 * need to be retrieved based on multiple optional criteria.
 *
 * Behavior:
 * - Supports filtering by multiple fields (status, category, region, etc.).
 * - Enables sorting and ordering of results.
 * - Provides pagination support with page and limit.
 * - Works with NestJS ValidationPipe to validate query parameters.
 *
 * Integration:
 * - Used in controller endpoint:
 *   GET /reports
 * - Passed to the service layer to construct dynamic queries.
 *
 * Flow:
 * 1. Client sends query parameters.
 * 2. DTO validates and transforms values.
 * 3. Service layer applies filters, sorting, and pagination.
 * 4. Filtered results are returned.
 */
export class GetReportsQueryDto {

  /**
   * status
   * ------
   * Optional filter for report status.
   *
   * Allowed values:
   * - pending
   * - approved
   * - rejected
   * - merged
   *
   * Used to retrieve reports based on their lifecycle state.
   */
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'merged'])
  status?: 'pending' | 'approved' | 'rejected' | 'merged';

  /**
   * categoryId
   * ----------
   * Optional filter by report category.
   *
   * Used to retrieve reports belonging to a specific category.
   *
   * Validation:
   * - Must be a valid UUID.
   */
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /**
   * regionId
   * --------
   * Optional filter by region.
   *
   * Used to retrieve reports from a specific geographic area.
   *
   * Validation:
   * - Must be a valid UUID.
   */
  @IsOptional()
  @IsUUID()
  regionId?: string;

  /**
   * incidentId
   * ----------
   * Optional filter by associated incident.
   *
   * Used to retrieve reports linked to a specific incident.
   *
   * Validation:
   * - Must be a valid UUID.
   */
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  /**
   * userId
   * ------
   * Optional filter by reporting user.
   *
   * Used to retrieve reports created by a specific user.
   *
   * Validation:
   * - Must be a valid UUID.
   */
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * from
   * ----
   * Optional start date filter.
   *
   * Used to retrieve reports created after a specific date.
   *
   * Expected format:
   * - ISO date string
   */
  @IsOptional()
  from?: string;

  /**
   * to
   * --
   * Optional end date filter.
   *
   * Used to retrieve reports created before a specific date.
   *
   * Expected format:
   * - ISO date string
   */
  @IsOptional()
  to?: string;

  /**
   * sortBy
   * ------
   * Optional field used for sorting results.
   *
   * Allowed values:
   * - createdAt
   * - reportTime
   * - confidenceScore
   *
   * Determines which field is used for ordering results.
   */
  @IsOptional()
  @IsIn(['createdAt', 'reportTime', 'confidenceScore'])
  sortBy?: 'createdAt' | 'reportTime' | 'confidenceScore';

  /**
   * sortOrder
   * ---------
   * Optional sorting direction.
   *
   * Allowed values:
   * - asc (ascending)
   * - desc (descending)
   */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  /**
   * page
   * ----
   * Optional page number for pagination.
   *
   * Default value: 1
   *
   * Validation:
   * - Must be an integer greater than or equal to 1.
   *
   * Transformation:
   * - Automatically converted to number using class-transformer.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * limit
   * -----
   * Optional number of records per page.
   *
   * Default value: 10
   *
   * Validation:
   * - Must be an integer between 1 and 100.
   *
   * Transformation:
   * - Automatically converted to number using class-transformer.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}