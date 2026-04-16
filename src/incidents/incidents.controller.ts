import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { VerifyIncidentDto } from './dto/verify-incident.dto';
import { CloseIncidentDto } from './dto/close-incident.dto';
import { RejectIncidentDto } from './dto/reject-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * CurrentUserType
 * ---------------
 * Represents the structure of the authenticated user
 * attached to the request after JWT validation.
 */
type CurrentUserType = {
  userId: string;
  email: string;
  role: string;
};

/**
 * IncidentsController
 * -------------------
 * Author: Eman
 *
 * This controller handles all HTTP requests related to incidents.
 *
 * It provides endpoints for:
 * - Retrieving incidents (with filtering, sorting, pagination)
 * - Retrieving a single incident
 * - Retrieving incident status history
 * - Creating a new incident
 * - Updating incident details
 * - Verifying an incident
 * - Closing an incident
 * - Rejecting an incident
 *
 * Security:
 * - All endpoints require authentication (JwtAuthGuard)
 * - Write/management operations require roles (moderator/admin)
 *
 * Base Route:
 * - /api/v1/incidents
 *
 * Dependencies:
 * - IncidentsService: Handles business logic
 * - JwtAuthGuard: Ensures authenticated access
 * - RolesGuard: Enforces role-based authorization
 */
@Controller('api/v1/incidents')
export class IncidentsController {
  /**
   * Constructor
   * -----------
   * Injects IncidentsService for handling business logic.
   *
   * @param incidentsService - Service responsible for incident operations
   */
  constructor(private readonly incidentsService: IncidentsService) {}

  /**
   * findAll
   * -------
   * Retrieves a list of incidents with optional filtering,
   * sorting, and pagination.
   *
   * Access:
   * - Any authenticated user
   *
   * Route:
   * - GET /api/v1/incidents
   *
   * @param query - Query parameters for filtering and pagination
   * @returns A list of incidents
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: ListIncidentsQueryDto) {
    return this.incidentsService.findAll(query);
  }

  /**
   * findOne
   * -------
   * Retrieves a specific incident by its ID.
   *
   * Access:
   * - Any authenticated user
   *
   * Route:
   * - GET /api/v1/incidents/:id
   *
   * @param id - Incident ID
   * @returns The incident details
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  /**
   * getStatusHistory
   * ----------------
   * Retrieves the status history of an incident.
   *
   * Access:
   * - Any authenticated user
   *
   * Route:
   * - GET /api/v1/incidents/:id/status-history
   *
   * @param id - Incident ID
   * @returns List of status history records
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string) {
    return this.incidentsService.getStatusHistory(id);
  }

  /**
   * create
   * ------
   * Creates a new incident.
   *
   * Only users with role "moderator" or "admin"
   * can perform this operation.
   *
   * Access:
   * - moderator
   * - admin
   *
   * Route:
   * - POST /api/v1/incidents
   *
   * @param dto - Incident creation data
   * @param user - Authenticated user
   * @returns Created incident
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Post()
  create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.incidentsService.create(dto, user.userId);
  }

  /**
   * update
   * ------
   * Updates general incident details.
   *
   * Access:
   * - moderator
   * - admin
   *
   * Route:
   * - PATCH /api/v1/incidents/:id
   *
   * @param id - Incident ID
   * @param dto - Updated data
   * @returns Updated incident
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id, dto);
  }

  /**
   * verify
   * ------
   * Marks an incident as verified.
   *
   * Access:
   * - moderator
   * - admin
   *
   * Route:
   * - PATCH /api/v1/incidents/:id/verify
   *
   * @param id - Incident ID
   * @param dto - Verification data
   * @param user - Authenticated user
   * @returns Updated incident
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id/verify')
  verify(
    @Param('id') id: string,
    @Body() dto: VerifyIncidentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.incidentsService.verify(id, dto, user.userId);
  }

  /**
   * close
   * -----
   * Marks an incident as closed.
   *
   * Access:
   * - moderator
   * - admin
   *
   * Route:
   * - PATCH /api/v1/incidents/:id/close
   *
   * @param id - Incident ID
   * @param dto - Closing data
   * @param user - Authenticated user
   * @returns Updated incident
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id/close')
  close(
    @Param('id') id: string,
    @Body() dto: CloseIncidentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.incidentsService.close(id, dto, user.userId);
  }

  /**
   * reject
   * ------
   * Marks an incident as rejected.
   *
   * Access:
   * - moderator
   * - admin
   *
   * Route:
   * - PATCH /api/v1/incidents/:id/reject
   *
   * @param id - Incident ID
   * @param dto - Rejection data
   * @param user - Authenticated user
   * @returns Updated incident
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectIncidentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.incidentsService.reject(id, dto, user.userId);
  }
}