import {
  IncidentSeverity,
  IncidentSourceType,
  IncidentStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * ListIncidentsQueryDto
 * ---------------------
 * Author: Eman
 *
 * This Data Transfer Object (DTO) is used to validate and define
 * query parameters for retrieving a list of incidents.
 *
 * It supports:
 * - Filtering (status, severity, category, region, checkpoint, source type)
 * - Date range filtering (occurredAt)
 * - Sorting (by multiple fields)
 * - Pagination (page & limit)
 *
 * Validation Rules:
 * - status must be a valid IncidentStatus enum (optional)
 * - severity must be a valid IncidentSeverity enum (optional)
 * - category, region, checkpoint must be valid UUIDs (optional)
 * - sourceType must be a valid IncidentSourceType enum (optional)
 * - dateFrom and dateTo must be valid ISO date strings (optional)
 * - sortBy must be one of the allowed fields
 * - sortOrder must be either 'asc' or 'desc'
 * - page must be an integer ≥ 1
 * - limit must be an integer between 1 and 100
 *
 * Notes:
 * - Default sorting is by createdAt in descending order
 * - Default pagination is page = 1 and limit = 10
 * - class-transformer is used to convert page and limit into numbers
 * - dateFrom and dateTo are used to filter incidents by occurrence date range
 */
export class ListIncidentsQueryDto {

  /**
   * status (optional)
   * -----------------
   * Filters incidents by their current status.
   *
   * @type IncidentStatus | undefined
   */
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  /**
   * severity (optional)
   * -------------------
   * Filters incidents by severity level.
   *
   * @type IncidentSeverity | undefined
   */
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  /**
   * category (optional)
   * -------------------
   * Filters incidents by category ID.
   *
   * Must be a valid UUID.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsUUID()
  category?: string;

  /**
   * region (optional)
   * -----------------
   * Filters incidents by region ID.
   *
   * Must be a valid UUID.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsUUID()
  region?: string;

  /**
   * checkpoint (optional)
   * ---------------------
   * Filters incidents by checkpoint ID.
   *
   * Must be a valid UUID.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsUUID()
  checkpoint?: string;

  /**
   * sourceType (optional)
   * ---------------------
   * Filters incidents by their source type
   * (e.g., official, crowd, external API).
   *
   * @type IncidentSourceType | undefined
   */
  @IsOptional()
  @IsEnum(IncidentSourceType)
  sourceType?: IncidentSourceType;

  /**
   * dateFrom (optional)
   * -------------------
   * Filters incidents that occurred on or after this date.
   *
   * Must be a valid ISO date string.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  /**
   * dateTo (optional)
   * -----------------
   * Filters incidents that occurred on or before this date.
   *
   * Must be a valid ISO date string.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  /**
   * sortBy (optional)
   * -----------------
   * Specifies the field used for sorting results.
   *
   * Allowed values:
   * - createdAt
   * - updatedAt
   * - occurredAt
   * - severity
   * - status
   *
   * Default: createdAt
   *
   * @type 'createdAt' | 'updatedAt' | 'occurredAt' | 'severity' | 'status'
   */
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'occurredAt', 'severity', 'status'])
  sortBy?: 'createdAt' | 'updatedAt' | 'occurredAt' | 'severity' | 'status' =
    'createdAt';

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