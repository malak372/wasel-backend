import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

/**
 * IncidentsModule
 * ---------------
 * Author: Eman
 *
 * This module encapsulates all components related to
 * incident management in the application.
 *
 * It is responsible for organizing and registering:
 * - IncidentsController: Handles incoming HTTP requests
 * - IncidentsService: Contains business logic and data operations
 *
 * Responsibilities:
 * - Groups all incident-related functionality in one module
 * - Connects the controller with the service layer
 * - Exposes the IncidentsService for use in other modules
 *
 * Components:
 * - controllers: [IncidentsController]
 * - providers: [IncidentsService]
 * - exports: [IncidentsService]
 *
 * Notes:
 * - This module follows NestJS modular architecture
 * - Keeps the application structured and maintainable
 */
@Module({
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}