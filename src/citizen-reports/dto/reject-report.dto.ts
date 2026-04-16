import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * RejectReportDto
 * ---------------
 * Author: Malak
 *
 * Data Transfer Object (DTO) used for rejecting reports.
 *
 * This DTO is used when a moderator reviews a report and decides
 * that it should not be approved or processed further.
 *
 * Behavior:
 * - Allows the moderator to optionally provide a reason for rejection.
 * - Ensures the reason meets validation constraints if provided.
 *
 * Integration:
 * - Used in controller endpoint:
 *   PATCH /reports/:id/reject
 * - Passed to the service layer to handle rejection logic.
 *
 * Flow:
 * 1. Client sends an optional reason for rejection.
 * 2. DTO validates the input.
 * 3. Service marks the report as rejected.
 * 4. Optional reason may be stored for auditing or tracking purposes.
 *
 * Notes:
 * - reason is optional but recommended for transparency.
 * - Used mainly by moderator or admin roles.
 */
export class RejectReportDto {

  /**
   * reason
   * ------
   * Optional explanation for rejecting the report.
   *
   * Used for:
   * - Logging moderation decisions
   * - Providing feedback or audit trails
   *
   * Validation:
   * - Must be a string.
   * - Minimum length: 3 characters.
   * - Maximum length: 500 characters.
   */
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason?: string;
}