import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * @file alerts.module.ts
 * @description The core module for managing system alerts.
 * This module integrates the controller and service for alert management
 * and provides database access through the PrismaModule.
 */

/**
 * @class AlertsModule
 * @description This module handles the registration of the AlertsController 
 * and AlertsService. It also exports the AlertsService to make it 
 * accessible to other modules within the application.
 */
@Module({
  /**
   * Imported modules required for this module's functionality.
   * PrismaModule is imported to allow the AlertsService to interact with the database.
   */
  imports: [PrismaModule],

  /**
   * The set of controllers defined in this module which have to be instantiated.
   */
  controllers: [AlertsController],

  /**
   * The providers that will be instantiated by the Nest injector and that 
   * may be shared at least across this module.
   */
  providers: [AlertsService],

  /**
   * The subset of providers that are provided by this module and should be 
   * available in other modules which import this module.
   */
  exports: [AlertsService]
})
export class AlertsModule {}