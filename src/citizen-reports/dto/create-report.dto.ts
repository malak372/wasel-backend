import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * CreateReportDto
 * ---------------
 * Author: Malak
 *
 * Data Transfer Object (DTO) used for creating a new citizen report.
 *
 * This DTO defines the structure and validation rules for incoming
 * report data submitted by users.
 *
 * Behavior:
 * - Validates required and optional fields before processing.
 * - Ensures data integrity and consistency.
 * - Works with NestJS ValidationPipe to reject invalid requests.
 *
 * Integration:
 * - Used in controller endpoint:
 *   POST /reports
 * - Passed to the service layer to create a new report record.
 *
 * Flow:
 * 1. Client sends report data.
 * 2. DTO validates input fields.
 * 3. Valid data is forwarded to the service layer.
 * 4. Report is stored in the database.
 */
export class CreateReportDto {

  /**
   * categoryId
   * ----------
   * Identifier of the report category.
   *
   * Used to classify the type of report
   * (e.g., accident, closure, delay).
   *
   * Validation:
   * - Must be a valid UUID.
   */
  @IsUUID()
  categoryId: string;

  /**
   * description
   * -----------
   * Detailed description of the reported incident.
   *
   * Provides context and explains the situation.
   *
   * Validation:
   * - Must be a string.
   * - Minimum length: 10 characters.
   * - Maximum length: 1000 characters.
   */
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  /**
   * latitude
   * --------
   * Optional geographic latitude of the report location.
   *
   * Used for mapping and geolocation purposes.
   *
   * Validation:
   * - Must be a valid latitude value if provided.
   */
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  /**
   * longitude
   * ---------
   * Optional geographic longitude of the report location.
   *
   * Used together with latitude to define the exact location.
   *
   * Validation:
   * - Must be a valid longitude value if provided.
   */
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  /**
   * regionId
   * --------
   * Optional identifier of the region where the report occurred.
   *
   * Used to associate the report with a specific geographic area.
   *
   * Validation:
   * - Must be a valid UUID.
   */
  @IsOptional()
  @IsUUID()
  regionId?: string;

  /**
   * reportTime
   * ----------
   * Optional timestamp indicating when the incident occurred.
   *
   * If not provided, the system may assign the current time.
   *
   * Validation:
   * - Must be a valid ISO date string.
   */
  @IsOptional()
  @IsDateString()
  reportTime?: string;
}