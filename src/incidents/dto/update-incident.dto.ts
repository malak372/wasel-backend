import { PartialType } from '@nestjs/mapped-types';
import { CreateIncidentDto } from './create-incident.dto';

/**
 * UpdateIncidentDto
 * -----------------
 * Author: Eman
 *
 * This Data Transfer Object (DTO) is used to define and validate
 * the request body for updating an existing incident.
 *
 * It extends CreateIncidentDto using PartialType,
 * which makes all properties optional.
 *
 * This allows clients to update only the fields they need
 * without sending the full object.
 *
 * Behavior:
 * - Inherits all validation rules from CreateIncidentDto
 * - Converts all fields into optional fields
 *
 * Example:
 * Instead of sending all fields:
 * {
 *   title, description, categoryId, severity, sourceType,
 *   checkpointId, regionId, latitude, longitude, occurredAt
 * }
 *
 * You can send only what you want to update:
 * {
 *   title: "Updated Incident Title"
 * }
 *
 * Usage:
 * - Used in the endpoint: PATCH /api/v1/incidents/:id
 *
 * Notes:
 * - Validation is still applied to any provided field
 * - Fields that are not provided will remain unchanged
 * - Business logic is handled in the service layer
 */
export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {}