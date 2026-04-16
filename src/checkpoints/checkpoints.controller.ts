import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CheckpointsService } from './checkpoints.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { UpdateCheckpointStatusDto } from './dto/update-checkpoint-status.dto';
import { ListCheckpointsQueryDto } from './dto/list-checkpoints-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * CurrentUserType
 * ---------------
 * Represents the structure of the authenticated user
 * attached to the incoming request after successful JWT validation.
 *
 * Properties:
 * - userId: Unique identifier of the authenticated user
 * - email: Email address of the authenticated user
 * - role: Role assigned to the authenticated user
 */
type CurrentUserType = {
  userId: string;
  email: string;
  role: string;
};

/**
 * CheckpointsController
 * ---------------------
 * Author: Eman
 *
 * This controller is responsible for handling all HTTP requests
 * related to checkpoints in the system.
 *
 * It provides endpoints for:
 * - Retrieving all checkpoints
 * - Retrieving a single checkpoint by ID
 * - Retrieving checkpoint status history
 * - Creating a new checkpoint
 * - Updating checkpoint information
 * - Updating checkpoint status
 * - Deleting a checkpoint
 *
 * Security:
 * - All endpoints require authentication using JwtAuthGuard.
 * - Sensitive operations such as create, update, status update,
 *   and delete require role-based authorization using RolesGuard.
 *
 * Base Route:
 * - /api/v1/checkpoints
 *
 * Dependencies:
 * - CheckpointsService: Handles the business logic for checkpoint operations.
 * - JwtAuthGuard: Ensures that only authenticated users can access endpoints.
 * - RolesGuard: Ensures that only users with allowed roles can access restricted endpoints.
 */
@Controller('api/v1/checkpoints')
export class CheckpointsController {
  /**
   * Constructor
   * -----------
   * Injects the CheckpointsService used to perform
   * business logic and database operations related to checkpoints.
   *
   * @param checkpointsService - Service responsible for checkpoint operations
   */
  constructor(private readonly checkpointsService: CheckpointsService) {}

  /**
   * findAll
   * -------
   * Retrieves a list of all checkpoints.
   *
   * This endpoint supports query parameters for filtering,
   * sorting, and pagination through ListCheckpointsQueryDto.
   *
   * Access:
   * - Any authenticated user
   *
   * Route:
   * - GET /api/v1/checkpoints
   *
   * @param query - Query parameters used to filter, sort, or paginate checkpoints
   * @returns A list of checkpoints matching the query criteria
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: ListCheckpointsQueryDto) {
    return this.checkpointsService.findAll(query);
  }

  /**
   * findOne
   * -------
   * Retrieves a single checkpoint by its unique identifier.
   *
   * Access:
   * - Any authenticated user
   *
   * Route:
   * - GET /api/v1/checkpoints/:id
   *
   * @param id - Unique identifier of the checkpoint
   * @returns The checkpoint details if found
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkpointsService.findOne(id);
  }

  /**
   * getStatusHistory
   * ----------------
   * Retrieves the status history of a specific checkpoint.
   *
   * This includes previous status updates recorded for the checkpoint.
   *
   * Access:
   * - Any authenticated user
   *
   * Route:
   * - GET /api/v1/checkpoints/:id/status-history
   *
   * @param id - Unique identifier of the checkpoint
   * @returns A list of status history records for the given checkpoint
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string) {
    return this.checkpointsService.getStatusHistory(id);
  }

  /**
   * create
   * ------
   * Creates a new checkpoint in the system.
   *
   * Only users with role "moderator" or "admin"
   * are allowed to perform this action.
   *
   * The authenticated user's ID is passed to the service
   * in order to track who created the checkpoint.
   *
   * Access:
   * - moderator
   * - admin
   *
   * Route:
   * - POST /api/v1/checkpoints
   *
   * @param dto - Data transfer object containing checkpoint creation data
   * @param user - Authenticated user extracted from the request
   * @returns The newly created checkpoint
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Post()
  create(
    @Body() dto: CreateCheckpointDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.checkpointsService.create(dto, user.userId);
  }

  /**
   * update
   * ------
   * Updates the general information of an existing checkpoint.
   *
   * Only users with role "moderator" or "admin"
   * are allowed to perform this action.
   *
   * Access:
   * - moderator
   * - admin
   *
   * Route:
   * - PATCH /api/v1/checkpoints/:id
   *
   * @param id - Unique identifier of the checkpoint to update
   * @param dto - Data transfer object containing updated checkpoint data
   * @returns The updated checkpoint
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCheckpointDto) {
    return this.checkpointsService.update(id, dto);
  }

  /**
   * updateStatus
   * ------------
   * Updates the status of a specific checkpoint.
   *
   * This operation is separated from the general update endpoint
   * because status changes may require special handling,
   * such as recording status history.
   *
   * Only users with role "moderator" or "admin"
   * are allowed to perform this action.
   *
   * The authenticated user's ID is passed to the service
   * so the system can record who changed the status.
   *
   * Access:
   * - moderator
   * - admin
   *
   * Route:
   * - PATCH /api/v1/checkpoints/:id/status
   *
   * @param id - Unique identifier of the checkpoint
   * @param dto - Data transfer object containing the new status data
   * @param user - Authenticated user extracted from the request
   * @returns The updated checkpoint status result
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCheckpointStatusDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.checkpointsService.updateStatus(id, dto, user.userId);
  }

  /**
   * remove
   * ------
   * Deletes a checkpoint from the system.
   *
   * Only users with role "moderator" or "admin"
   * are allowed to perform this action.
   *
   * Access:
   * - moderator
   * - admin
   *
   * Route:
   * - DELETE /api/v1/checkpoints/:id
   *
   * @param id - Unique identifier of the checkpoint to delete
   * @returns The result of the delete operation
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checkpointsService.remove(id);
  }
}