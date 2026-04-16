import { CheckpointStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * UpdateCheckpointStatusDto
 * -------------------------
 * Author: Eman
 *
 * This Data Transfer Object (DTO) is used to validate and define
 * the request body for updating the status of a checkpoint.
 *
 * It ensures that:
 * - A valid checkpoint status is provided
 * - An optional note can be included to describe the reason for the status change
 *
 * Validation Rules:
 * - status must be a valid value from the CheckpointStatus enum
 * - note is optional but must be a string if provided
 *
 * Usage:
 * - Used in the endpoint: PATCH /api/v1/checkpoints/:id/status
 * - Helps enforce clean and consistent input before reaching the service layer
 *
 * Notes:
 * - The actual status update and history tracking are handled in the service layer
 * - The note can be used for auditing or explanation purposes
 */
export class UpdateCheckpointStatusDto {

  /**
   * status
   * ------
   * The new status to be assigned to the checkpoint.
   *
   * Must be one of the predefined values in CheckpointStatus enum.
   *
   * @type CheckpointStatus
   */
  @IsEnum(CheckpointStatus)
  status: CheckpointStatus;

  /**
   * note (optional)
   * ---------------
   * Additional note explaining the reason for the status change.
   *
   * This can be used for logging, auditing, or providing context.
   *
   * @type string | undefined
   */
  @IsOptional()
  @IsString()
  note?: string;
}