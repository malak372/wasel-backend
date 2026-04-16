import { CheckpointStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * CreateCheckpointDto
 * -------------------
 * Author: Eman
 *
 * This Data Transfer Object (DTO) is used to validate and
 * define the structure of data required to create a new checkpoint.
 *
 * It ensures that incoming request data is:
 * - Properly typed
 * - Within valid ranges
 * - Conforms to expected formats
 *
 * Validation Rules:
 * - name must be a non-empty string
 * - latitude must be a number between -90 and 90
 * - longitude must be a number between -180 and 180
 * - regionId must be a valid UUID
 * - description is optional
 * - currentStatus is optional but must be a valid CheckpointStatus enum
 *
 * Notes:
 * - class-transformer is used to convert latitude and longitude
 *   into numbers before validation
 * - class-validator ensures strict validation before reaching the service layer
 */
export class CreateCheckpointDto {

  /**
   * name
   * ----
   * Name of the checkpoint.
   *
   * @type string
   */
  @IsString()
  name: string;

  /**
   * latitude
   * --------
   * Geographic latitude of the checkpoint.
   *
   * Must be within the valid range:
   * -90 (South Pole) to 90 (North Pole)
   *
   * @type number
   */
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  /**
   * longitude
   * ---------
   * Geographic longitude of the checkpoint.
   *
   * Must be within the valid range:
   * -180 to 180
   *
   * @type number
   */
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  /**
   * regionId
   * --------
   * Unique identifier of the region to which the checkpoint belongs.
   *
   * Must be a valid UUID.
   *
   * @type string
   */
  @IsUUID()
  regionId: string;

  /**
   * description (optional)
   * ---------------------
   * Additional descriptive information about the checkpoint.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * currentStatus (optional)
   * -----------------------
   * Initial status of the checkpoint.
   *
   * Must be one of the values defined in CheckpointStatus enum.
   *
   * If not provided, a default value may be assigned in the service.
   *
   * @type CheckpointStatus | undefined
   */
  @IsOptional()
  @IsEnum(CheckpointStatus)
  currentStatus?: CheckpointStatus;
}