import { Module } from '@nestjs/common';
import { AlertSubscriptionsService } from './alert-subscriptions.service';
import { AlertSubscriptionsController } from './alert-subscriptions.controller';
import { PrismaModule } from '../prisma/prisma.module'; 

/**
 * @file alert-subscriptions.module.ts
 * @description The module responsible for orchestrating the alert subscription feature.
 * It encapsulates the controller and service while importing PrismaModule for database access.
 */

/**
 * @class AlertSubscriptionsModule
 * @description This module handles all dependencies related to user alert subscriptions,
 * ensuring that the AlertSubscriptionsService has access to the Prisma client and is
 * correctly mapped to the AlertSubscriptionsController.
 */
@Module({
  /**
   * Imported modules required by this module.
   * PrismaModule is included to provide database connectivity via dependency injection.
   */
  imports: [PrismaModule],

  /**
   * Controllers defined within this module that handle incoming HTTP requests.
   */
  controllers: [AlertSubscriptionsController],

  /**
   * Providers (services) that will be instantiated by the NestJS injector 
   * and can be shared across this module.
   */
  providers: [AlertSubscriptionsService],
})
export class AlertSubscriptionsModule {}