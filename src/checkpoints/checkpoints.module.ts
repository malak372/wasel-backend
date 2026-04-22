import { Module } from '@nestjs/common';
import { CheckpointsController } from './checkpoints.controller';
import { CheckpointsService } from './checkpoints.service';
import { CheckpointsResolver } from './checkpoints.resolver';

/**
 * CheckpointsModule
 * -----------------
 * Author: Eman
 *
 * This module groups together all components related to
 * checkpoint management in the application.
 *
 * It is responsible for organizing and registering:
 * - CheckpointsController: Handles incoming HTTP requests
 * - CheckpointsService: Contains business logic and data operations
 *
 * Responsibilities:
 * - Encapsulates checkpoint-related functionality
 * - Connects the controller with the service
 * - Exports the CheckpointsService so it can be used
 *   by other modules if needed
 *
 * Components:
 * - controllers: Contains CheckpointsController
 * - providers: Contains CheckpointsService
 * - exports: Exposes CheckpointsService outside this module
 *
 * This module helps keep the application modular,
 * maintainable, and organized according to NestJS architecture.
 */
@Module({
  controllers: [CheckpointsController],
  providers: [CheckpointsService,CheckpointsResolver],
  exports: [CheckpointsService],
})
export class CheckpointsModule {}