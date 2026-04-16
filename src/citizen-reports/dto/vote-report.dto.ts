import { IsIn } from 'class-validator';

/**
 * VoteReportDto
 * -------------
 * Author: Malak
 *
 * Data Transfer Object (DTO) used for voting on reports.
 *
 * This DTO is used when a user interacts with a report by either
 * confirming its validity or denying it.
 *
 * Behavior:
 * - Restricts the vote type to predefined values.
 * - Ensures consistent voting inputs across the system.
 *
 * Integration:
 * - Used in controller endpoint:
 *   POST /reports/:id/votes
 * - Passed to the service layer to record user votes.
 *
 * Flow:
 * 1. User submits a vote (confirm or deny).
 * 2. DTO validates the vote type.
 * 3. Service records the vote in the database.
 * 4. Voting data may influence report credibility or confidence score.
 *
 * Notes:
 * - Each user may be restricted to a single vote per report.
 * - Vote results can be used for report verification logic.
 */
export class VoteReportDto {

  /**
   * voteType
   * --------
   * Defines the type of vote submitted by the user.
   *
   * Allowed values:
   * - confirm: Indicates the report is valid.
   * - deny: Indicates the report is not valid.
   *
   * Validation:
   * - Must match one of the predefined values.
   */
  @IsIn(['confirm', 'deny'])
  voteType: 'confirm' | 'deny';
}