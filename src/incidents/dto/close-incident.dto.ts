import { IsOptional, IsString } from 'class-validator';

/**
 * CloseIncidentDto
 * ----------------
 * Author: Eman
 *
 * This Data Transfer Object (DTO) is used to validate and define
 * the request body for closing an incident.
 *
 * It allows an optional reason to be provided explaining
 * why the incident is being closed.
 *
 * Validation Rules:
 * - reason is optional
 * - If provided, it must be a string
 *
 * Usage:
 * - Used in the endpoint: PATCH /api/v1/incidents/:id/close
 *
 * Notes:
 * - The reason is stored in the incident status history
 * - The actual closing logic is handled in the service layer
 */
export class CloseIncidentDto {

  /**
   * reason (optional)
   * -----------------
   * Provides an explanation for why the incident is being closed.
   *
   * This can be used for logging, auditing, or tracking purposes.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsString()
  reason?: string;
}