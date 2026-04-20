import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { AuthModule } from '../auth/auth.module';

/**
 * RoutesModule
 * ------------
 * Author: Eman
 *
 * Module responsible for grouping all route-related components.
 *
 * This module includes:
 * - RoutesController: Handles incoming HTTP requests for routes
 * - RoutesService: Contains business logic for route operations
 *
 * Imports:
 * - HttpModule: Enables HTTP requests to external APIs (e.g., routing providers)
 * - AuthModule: Provides authentication and guards for securing endpoints
 *
 * Responsibilities:
 * - Route estimation logic integration
 * - External API communication (e.g., OSRM or other providers)
 * - Managing route-related endpoints
 *
 * Notes:
 * - This module is part of the core backend (not just GraphQL bonus)
 * - Works with authenticated users only
 */
@Module({
  imports: [HttpModule, AuthModule],
  controllers: [RoutesController],
  providers: [RoutesService],
})
export class RoutesModule {}