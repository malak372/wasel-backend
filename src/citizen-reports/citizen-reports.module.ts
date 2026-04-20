import { Module } from '@nestjs/common';
import { CitizenReportsController } from './citizen-reports.controller';
import { CitizenReportsService } from './citizen-reports.service';
import { ReportsResolver } from './report.resolver';

/**
 * CitizenReportsModule
 * --------------------
 * Author: Malak
 *
 * Module responsible for managing all components related to citizen reports.
 *
 * This module groups together the controller and service that handle
 * report creation, retrieval, moderation, and voting operations.
 *
 * Responsibilities:
 * - Registers the CitizenReportsController to handle HTTP requests.
 * - Provides the CitizenReportsService containing business logic.
 * - Exposes the service for use in other modules.
 *
 * Structure:
 * - Controllers:
 *   - CitizenReportsController: Handles incoming API requests for reports.
 *
 * - Providers:
 *   - CitizenReportsService: Contains core logic for report management.
 *
 * - Exports:
 *   - CitizenReportsService: Allows other modules to reuse report logic.
 *
 * Integration:
 * - Typically imported into the main application module (AppModule).
 * - Can be integrated with other modules such as AuthModule
 *   for authentication and authorization.
 *
 * Notes:
 * - This module follows a modular architecture pattern in NestJS.
 * - Encourages separation of concerns between controllers and services.
 */
@Module({
  controllers: [CitizenReportsController],
  providers: [CitizenReportsService,ReportsResolver],
  exports: [CitizenReportsService],
})
export class CitizenReportsModule {}