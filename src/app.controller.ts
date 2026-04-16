import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * AppController
 * -------------
 * Author:  All Team Members
 *
 * Main application controller responsible for handling basic routes.
 *
 * Responsibilities:
 * - Defines HTTP endpoints
 * - Delegates business logic to AppService
 *
 * Notes:
 * - Acts as an entry point for incoming HTTP requests
 * - Keeps logic minimal by relying on services
 */
@Controller()
export class AppController {

  /**
   * Constructor
   * -----------
   * Injects AppService dependency.
   *
   * @param appService - Service responsible for business logic
   */
  constructor(private readonly appService: AppService) {}

  /**
   * getHello
   * --------
   * Handles GET requests to the root endpoint (/).
   *
   * @returns string - A greeting message returned from AppService
   *
   * Behavior:
   * - Calls appService.getHello()
   * - Returns the result directly to the client
   *
   * Route:
   * - GET /
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}