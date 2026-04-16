import { PartialType } from '@nestjs/mapped-types';
import { CreateCheckpointDto } from './create-checkpoint.dto';

/**
 * UpdateCheckpointDto
 * -------------------
 * Author: Eman
 *
 * This Data Transfer Object (DTO) is used to define and validate
 * the request body for updating an existing checkpoint.
 *
 * It extends CreateCheckpointDto using PartialType,
 * which makes all properties optional.
 *
 * This allows clients to update only the fields they need
 * without sending the full object.
 *
 * Behavior:
 * - Inherits all validation rules from CreateCheckpointDto
 * - Converts all fields to optional
 *
 * Example:
 * Instead of sending all fields:
 * {
 *   name, latitude, longitude, regionId, description, currentStatus
 * }
 *
 * You can send only what you want to update:
 * {
 *   name: "New Name"
 * }
 *
 * Usage:
 * - Used in the endpoint: PATCH /api/v1/checkpoints/:id
 *
 * Notes:
 * - Validation is still applied to provided fields
 * - Missing fields will not be modified
 * - Business logic for applying updates is handled in the service layer
 */
export class UpdateCheckpointDto extends PartialType(CreateCheckpointDto) {}