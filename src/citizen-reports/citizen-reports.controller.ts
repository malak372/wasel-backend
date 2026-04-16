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
import { Throttle } from '@nestjs/throttler';
import { CitizenReportsService } from './citizen-reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { GetReportsQueryDto } from './dto/get-reports-query.dto';
import { ApproveReportDto } from './dto/approve-report.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { MergeReportDto } from './dto/merge-report.dto';
import { VoteReportDto } from './dto/vote-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * CitizenReportsController
 * ------------------------
 * Author: Malak
 *
 * Controller responsible for handling all HTTP requests related to citizen reports.
 *
 * This controller exposes endpoints for:
 * - Creating a new report
 * - Retrieving reports
 * - Retrieving a specific report
 * - Approving a report
 * - Rejecting a report
 * - Merging reports
 * - Voting on reports
 *
 * Security:
 * - Protected routes use JwtAuthGuard for authentication.
 * - Moderator/admin-only routes use RolesGuard with Roles decorator.
 *
 * Additional Features:
 * - Report creation is rate-limited using throttling to reduce abuse.
 *
 * Base Route:
 * - /api/v1/reports
 *
 * Dependencies:
 * - CitizenReportsService: Handles the business logic for report operations.
 * - DTOs: Validate incoming request data.
 * - Guards: Enforce authentication and authorization.
 * - CurrentUser decorator: Extracts the authenticated user from the request.
 */
@Controller('api/v1/reports')
export class CitizenReportsController {

  /**
   * Constructor
   * -----------
   * Injects the CitizenReportsService used to process citizen report operations.
   *
   * @param citizenReportsService - Service containing report-related business logic
   */
  constructor(private readonly citizenReportsService: CitizenReportsService) {}

  /**
   * create
   * ------
   * Creates a new citizen report.
   *
   * Route:
   * - POST /api/v1/reports
   *
   * Security:
   * - Requires JWT authentication.
   * - Protected by JwtAuthGuard.
   * - Rate limited using Throttle to reduce spam and abuse.
   *
   * @param dto - Request body containing the report data
   * @param user - Authenticated user extracted from the request
   * @returns Newly created report
   *
   * Behavior:
   * - Validates the request body using CreateReportDto.
   * - Uses the authenticated user's identity as the report owner.
   * - Forwards validated data to the service layer for report creation.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  create(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.create(dto, user);
  }

  /**
   * findAll
   * -------
   * Retrieves a filtered and paginated list of reports.
   *
   * Route:
   * - GET /api/v1/reports
   *
   * Security:
   * - Requires JWT authentication.
   * - Restricted to users with moderator or admin roles.
   * - Protected by JwtAuthGuard and RolesGuard.
   *
   * @param query - Query parameters used for filtering, sorting, and pagination
   * @returns A list of reports matching the specified query criteria
   *
   * Behavior:
   * - Validates query parameters using GetReportsQueryDto.
   * - Allows filtering by status, category, region, incident, and user.
   * - Supports sorting and pagination.
   * - Delegates retrieval logic to the service layer.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  findAll(@Query() query: GetReportsQueryDto) {
    return this.citizenReportsService.findAll(query);
  }

  /**
   * findOne
   * -------
   * Retrieves a single report by its identifier.
   *
   * Route:
   * - GET /api/v1/reports/:id
   *
   * Security:
   * - Requires JWT authentication.
   * - Protected by JwtAuthGuard.
   *
   * @param id - Unique identifier of the report
   * @param user - Authenticated user extracted from the request
   * @returns The requested report
   *
   * Behavior:
   * - Retrieves a report using its ID.
   * - May apply access checks in the service layer based on the current user.
   * - Returns report details if found and accessible.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.findOne(id, user);
  }

  /**
   * approve
   * -------
   * Approves a citizen report.
   *
   * Route:
   * - PATCH /api/v1/reports/:id/approve
   *
   * Security:
   * - Requires JWT authentication.
   * - Restricted to moderator and admin roles.
   * - Protected by JwtAuthGuard and RolesGuard.
   *
   * @param id - Unique identifier of the report to approve
   * @param dto - Approval data containing optional incident details or references
   * @param user - Authenticated user performing the approval action
   * @returns The approval result
   *
   * Behavior:
   * - Validates the approval payload using ApproveReportDto.
   * - Allows linking the report to an existing incident or creating/updating incident data.
   * - Delegates moderation and approval logic to the service layer.
   */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveReportDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.approve(id, dto, user);
  }

  /**
   * reject
   * ------
   * Rejects a citizen report.
   *
   * Route:
   * - PATCH /api/v1/reports/:id/reject
   *
   * Security:
   * - Requires JWT authentication.
   * - Restricted to moderator and admin roles.
   * - Protected by JwtAuthGuard and RolesGuard.
   *
   * @param id - Unique identifier of the report to reject
   * @param dto - Optional rejection reason
   * @param user - Authenticated user performing the rejection action
   * @returns The rejection result
   *
   * Behavior:
   * - Validates the rejection payload using RejectReportDto.
   * - Marks the report as rejected.
   * - Optionally stores the moderator's reason for auditing purposes.
   * - Delegates rejection logic to the service layer.
   */
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectReportDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.reject(id, dto, user);
  }

  /**
   * merge
   * -----
   * Merges a report into another existing report.
   *
   * Route:
   * - PATCH /api/v1/reports/:id/merge
   *
   * Security:
   * - Requires JWT authentication.
   * - Restricted to moderator and admin roles.
   * - Protected by JwtAuthGuard and RolesGuard.
   *
   * @param id - Unique identifier of the source report
   * @param dto - Merge data containing the target report ID and optional reason
   * @param user - Authenticated user performing the merge action
   * @returns The merge result
   *
   * Behavior:
   * - Validates the merge payload using MergeReportDto.
   * - Merges the source report into the specified target report.
   * - Optionally records the reason for the merge.
   * - Delegates merge logic to the service layer.
   */
  @Patch(':id/merge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  merge(
    @Param('id') id: string,
    @Body() dto: MergeReportDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.merge(id, dto, user);
  }

  /**
   * vote
   * ----
   * Records a user vote on a report.
   *
   * Route:
   * - POST /api/v1/reports/:id/votes
   *
   * Security:
   * - Requires JWT authentication.
   * - Protected by JwtAuthGuard.
   *
   * @param id - Unique identifier of the report being voted on
   * @param dto - Vote payload containing the vote type
   * @param user - Authenticated user casting the vote
   * @returns The voting result
   *
   * Behavior:
   * - Validates the vote payload using VoteReportDto.
   * - Allows users to confirm or deny a report.
   * - Delegates voting logic to the service layer.
   * - Vote results may influence report confidence or verification logic.
   */
  @Post(':id/votes')
  @UseGuards(JwtAuthGuard)
  vote(
    @Param('id') id: string,
    @Body() dto: VoteReportDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.vote(id, dto, user);
  }
}