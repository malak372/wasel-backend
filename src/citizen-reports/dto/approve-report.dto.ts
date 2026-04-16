import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * ApproveReportDto
 * ----------------
 * Author: Malak
 *
 * Data Transfer Object (DTO) used in the report approval process.
 *
 * This DTO is responsible for validating and structuring the data
 * provided when a moderator approves a citizen report.
 *
 * It enables flexible workflows where a report can either:
 * - Be linked to an existing incident, or
 * - Be used to create or update a new incident.
 *
 * Behavior:
 * - All fields are optional to allow partial updates.
 * - Validation rules ensure correctness and data integrity.
 * - Works with NestJS ValidationPipe to reject invalid requests.
 *
 * Integration:
 * - Used in controller endpoint:
 *   PATCH /reports/:id/approve
 * - Passed to service layer method responsible for approval logic.
 *
 * Flow:
 * 1. Controller receives request body.
 * 2. DTO validates input fields.
 * 3. Valid data is forwarded to service layer.
 * 4. Service decides how to process the report (link or create incident).
 */
export class ApproveReportDto {

  /**
   * incidentId
   * ----------
   * Optional reference to an existing incident.
   *
   * If provided:
   * - The report will be linked to an existing incident.
   *
   * Validation:
   * - Must be a valid UUID.
   */
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  /**
   * title
   * -----
   * Optional title for the incident.
   *
   * Used when:
   * - Creating a new incident from the report.
   *
   * Validation:
   * - Must be a string.
   * - Minimum length: 3 characters.
   * - Maximum length: 200 characters.
   */
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  /**
   * description
   * -----------
   * Optional detailed description of the incident.
   *
   * Used to provide additional context during approval.
   *
   * Validation:
   * - Must be a string.
   * - Maximum length: 1000 characters.
   */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /**
   * severity
   * --------
   * Optional severity level of the incident.
   *
   * Defines the importance or urgency level.
   *
   * Allowed Values:
   * - low
   * - medium
   * - high
   * - critical
   *
   * Validation:
   * - Must match one of the predefined values.
   */
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity?: 'low' | 'medium' | 'high' | 'critical';

  /**
   * checkpointId
   * ------------
   * Optional reference to a related checkpoint.
   *
   * Used when:
   * - The incident is associated with a specific checkpoint location.
   *
   * Validation:
   * - Must be a valid UUID.
   */
  @IsOptional()
  @IsUUID()
  checkpointId?: string;

  /**
   * regionId
   * --------
   * Optional reference to a region.
   *
   * Used to categorize the incident geographically.
   *
   * Validation:
   * - Must be a valid UUID.
   */
  @IsOptional()
  @IsUUID()
  regionId?: string;

  /**
   * reason
   * ------
   * Optional explanation provided by the moderator.
   *
   * Used for:
   * - Logging moderation decisions
   * - Auditing approval actions
   *
   * Validation:
   * - Must be a string.
   * - Maximum length: 500 characters.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}