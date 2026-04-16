import { CheckpointStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * ListCheckpointsQueryDto
 * -----------------------
 * Author: Eman
 *
 * This Data Transfer Object (DTO) is used to validate and define
 * query parameters for retrieving a list of checkpoints.
 *
 * It supports:
 * - Filtering (by status and region)
 * - Searching (by checkpoint name)
 * - Sorting (by specific fields)
 * - Pagination (page & limit)
 *
 * Validation Rules:
 * - status must be a valid CheckpointStatus enum (optional)
 * - region must be a valid UUID (optional)
 * - search must be a string (optional)
 * - sortBy must be one of the allowed fields
 * - sortOrder must be either 'asc' or 'desc'
 * - page must be an integer ≥ 1
 * - limit must be an integer between 1 and 100
 *
 * Notes:
 * - Default sorting is by createdAt in descending order
 * - Default pagination is page = 1 and limit = 10
 * - class-transformer is used to convert page and limit into numbers
 */
export class ListCheckpointsQueryDto {

  /**
   * status (optional)
   * -----------------
   * Filters checkpoints by their current status.
   *
   * @type CheckpointStatus | undefined
   */
  @IsOptional()
  @IsEnum(CheckpointStatus)
  status?: CheckpointStatus;

  /**
   * region (optional)
   * -----------------
   * Filters checkpoints by region ID.
   *
   * Must be a valid UUID.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsUUID()
  region?: string;

  /**
   * search (optional)
   * -----------------
   * Performs a case-insensitive search on checkpoint names.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * sortBy (optional)
   * -----------------
   * Specifies the field used for sorting results.
   *
   * Allowed values:
   * - name
   * - createdAt
   * - updatedAt
   * - currentStatus
   *
   * Default: createdAt
   *
   * @type 'name' | 'createdAt' | 'updatedAt' | 'currentStatus'
   */
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt', 'currentStatus'])
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'currentStatus' = 'createdAt';

  /**
   * sortOrder (optional)
   * --------------------
   * Defines the sorting order.
   *
   * Allowed values:
   * - asc (ascending)
   * - desc (descending)
   *
   * Default: desc
   *
   * @type 'asc' | 'desc'
   */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  /**
   * page (optional)
   * ---------------
   * Specifies the page number for pagination.
   *
   * Must be an integer ≥ 1.
   *
   * Default: 1
   *
   * @type number
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * limit (optional)
   * ----------------
   * Specifies the number of records per page.
   *
   * Must be an integer between 1 and 100.
   *
   * Default: 10
   *
   * @type number
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}