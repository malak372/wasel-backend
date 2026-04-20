import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { EstimateRouteDto } from './dto/estimate-route.dto';
import { GetRoutesQueryDto } from './dto/get-routes-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * RoutesController
 * ----------------
 * Author: Eman
 *
 * Controller responsible for handling all route-related endpoints.
 *
 * This controller provides:
 * - Route estimation based on user input
 * - Retrieval of saved routes with pagination
 * - Retrieval of a specific route by ID
 *
 * Security:
 * - All endpoints are protected using JwtAuthGuard
 * - Only authenticated users can access these endpoints
 *
 * Base Route:
 * - /api/v1/routes
 *
 * Dependencies:
 * - RoutesService: Handles business logic for route operations
 */
@Controller('api/v1/routes')
@UseGuards(JwtAuthGuard)
export class RoutesController {

  /**
   * Constructor
   * -----------
   * Injects RoutesService for handling route-related operations.
   *
   * @param routesService - Service responsible for route logic
   */
  constructor(private readonly routesService: RoutesService) {}

  /**
   * estimateRoute
   * -------------
   * Endpoint:
   * - POST /api/v1/routes/estimate
   *
   * Description:
   * - Estimates a route between origin and destination
   * - Applies user preferences such as avoiding checkpoints or areas
   *
   * Behavior:
   * - Validates request body using EstimateRouteDto
   * - Uses authenticated user context
   * - Delegates logic to RoutesService
   *
   * @param dto - Route estimation input
   * @param user - Authenticated user
   * @returns Estimated route result
   */
  @Post('estimate')
  estimateRoute(
    @Body() dto: EstimateRouteDto,
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    return this.routesService.estimateRoute(dto, user);
  }

  /**
   * findAll
   * -------
   * Endpoint:
   * - GET /api/v1/routes
   *
   * Description:
   * - Retrieves a paginated list of routes
   *
   * Behavior:
   * - Applies pagination using GetRoutesQueryDto
   * - Returns routes associated with the authenticated user
   *
   * @param user - Authenticated user
   * @param query - Pagination parameters (page, limit)
   * @returns Paginated list of routes
   */
  @Get()
  findAll(
    @CurrentUser() user: { userId: string; email: string; role: string },
    @Query() query: GetRoutesQueryDto,
  ) {
    return this.routesService.findAll(user, query);
  }

  /**
   * findOne
   * -------
   * Endpoint:
   * - GET /api/v1/routes/:id
   *
   * Description:
   * - Retrieves a single route by its ID
   *
   * Behavior:
   * - Uses route ID from request parameters
   * - Ensures the route belongs to the authenticated user
   *
   * @param id - Route ID
   * @param user - Authenticated user
   * @returns Route details
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    return this.routesService.findOne(id, user);
  }
}