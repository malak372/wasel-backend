import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * MergeReportDto
 * --------------
 * Author: Malak
 *
 * Data Transfer Object (DTO) used for merging reports.
 *
 * This DTO is used when a moderator identifies duplicate or related reports
 * and decides to merge one report into another existing report.
 *
 * Behavior:
 * - Identifies the target report that will remain after merging.
 * - Optionally records the reason for the merge action.
 * - Ensures proper validation before processing the merge operation.
 *
 * Integration:
 * - Used in controller endpoint:
 *   PATCH /reports/:id/merge
 * - Passed to the service layer to perform merge logic.
 *
 * Flow:
 * 1. Client sends the target report ID and optional reason.
 * 2. DTO validates input fields.
 * 3. Service verifies both reports exist.
 * 4. Source report is merged into target report.
 * 5. Source report is marked as merged.
 *
 * Notes:
 * - targetReportId must refer to an existing report.
 * - reason is useful for audit logs and moderation tracking.
 */
export class MergeReportDto {

  /**
   * targetReportId
   * --------------
   * Identifier of the report that will remain after the merge.
   *
   * The current report will be merged into this target report.
   *
   * Validation:
   * - Must be a valid UUID.
   */
  @IsUUID()
  targetReportId: string;

  /**
   * reason
   * ------
   * Optional explanation for merging reports.
   *
   * Used for:
   * - Logging moderator actions
   * - Audit and traceability purposes
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