import {
  IncidentSeverity,
  IncidentSourceType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * CreateIncidentDto
 * -----------------
 * Author: Eman
 *
 * This Data Transfer Object (DTO) is used to validate and define
 * the request body for creating a new incident.
 *
 * It ensures that all required fields are present
 * and that optional fields (like location or relations)
 * are valid if provided.
 *
 * Validation Rules:
 * - title must be a string
 * - description is optional
 * - categoryId must be a valid UUID
 * - severity must be a valid IncidentSeverity enum
 * - sourceType must be a valid IncidentSourceType enum
 * - checkpointId is optional but must be a UUID if provided
 * - regionId is optional but must be a UUID if provided
 * - latitude must be between -90 and 90 (if provided)
 * - longitude must be between -180 and 180 (if provided)
 * - occurredAt must be a valid ISO date string
 *
 * Notes:
 * - class-transformer converts latitude and longitude into numbers
 * - At least one of (checkpointId, regionId, or coordinates)
 *   may be used to indicate location context
 * - The initial status (open) is set in the service layer
 */
export class CreateIncidentDto {

  /**
   * title
   * -----
   * Title of the incident.
   *
   * @type string
   */
  @IsString()
  title: string;

  /**
   * description (optional)
   * ---------------------
   * Detailed description of the incident.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * categoryId
   * ----------
   * Identifier of the incident category.
   *
   * Must be a valid UUID.
   *
   * @type string
   */
  @IsUUID()
  categoryId: string;

  /**
   * severity
   * --------
   * Severity level of the incident.
   *
   * Must be one of the values in IncidentSeverity enum.
   *
   * @type IncidentSeverity
   */
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  /**
   * sourceType
   * ----------
   * Source of the incident (e.g., official, crowd, external API).
   *
   * Must be one of the values in IncidentSourceType enum.
   *
   * @type IncidentSourceType
   */
  @IsEnum(IncidentSourceType)
  sourceType: IncidentSourceType;

  /**
   * checkpointId (optional)
   * ----------------------
   * Identifier of the related checkpoint.
   *
   * Must be a valid UUID if provided.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsUUID()
  checkpointId?: string;

  /**
   * regionId (optional)
   * -------------------
   * Identifier of the related region.
   *
   * Must be a valid UUID if provided.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsUUID()
  regionId?: string;

  /**
   * latitude (optional)
   * -------------------
   * Geographic latitude of the incident location.
   *
   * Must be between -90 and 90.
   *
   * @type number | undefined
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  /**
   * longitude (optional)
   * --------------------
   * Geographic longitude of the incident location.
   *
   * Must be between -180 and 180.
   *
   * @type number | undefined
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  /**
   * occurredAt
   * ----------
   * Timestamp indicating when the incident occurred.
   *
   * Must be a valid ISO date string.
   *
   * @type string
   */
  @IsDateString()
  occurredAt: string;
}