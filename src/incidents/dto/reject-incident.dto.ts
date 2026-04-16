import { IsString } from 'class-validator';

/**
 * RejectIncidentDto
 * -----------------
 * Author: Eman
 *
 * This Data Transfer Object (DTO) is used to validate and define
 * the request body for rejecting an incident.
 *
 * It requires a reason to be provided explaining
 * why the incident is being rejected.
 *
 * Validation Rules:
 * - reason is required
 * - reason must be a string
 *
 * Usage:
 * - Used in the endpoint: PATCH /api/v1/incidents/:id/reject
 *
 * Notes:
 * - The reason is stored in the incident status history
 * - Helps provide context for moderation decisions
 * - The actual rejection logic is handled in the service layer
 */
export class RejectIncidentDto {

  /**
   * reason
   * ------
   * Explanation for why the incident is being rejected.
   *
   * This is required to ensure transparency
   * and proper auditing of moderation actions.
   *
   * @type string
   */
  @IsString()
  reason: string;
}