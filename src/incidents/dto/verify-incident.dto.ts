import { IsOptional, IsString } from 'class-validator';

/**
 * VerifyIncidentDto
 * -----------------
 * Author: Eman
 *
 * This Data Transfer Object (DTO) is used to validate and define
 * the request body for verifying an incident.
 *
 * It allows an optional reason to be provided explaining
 * why the incident is being verified.
 *
 * Validation Rules:
 * - reason is optional
 * - If provided, it must be a string
 *
 * Usage:
 * - Used in the endpoint: PATCH /api/v1/incidents/:id/verify
 *
 * Notes:
 * - The reason is stored in the incident status history
 * - Helps provide context for verification actions
 * - The actual verification logic is handled in the service layer
 */
export class VerifyIncidentDto {

  /**
   * reason (optional)
   * -----------------
   * Explanation for why the incident is being verified.
   *
   * This can be used for auditing, logging,
   * or providing additional context.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsString()
  reason?: string;
}