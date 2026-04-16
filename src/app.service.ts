import { Injectable } from '@nestjs/common';

/**
 * AppService
 * ----------
 * Author: All Team Members
 *
 * Service layer responsible for handling business logic
 * related to the main application.
 *
 * Responsibilities:
 * - Provide data or responses required by the AppController
 * - Keep logic separated from the controller layer
 *
 * Notes:
 * - This is a simple example service used for demonstration
 * - Can be extended to include more complex logic
 */
@Injectable()
export class AppService {

  /**
   * getHello
   * --------
   * Returns a simple greeting message.
   *
   * @returns string - Greeting message
   *
   * Behavior:
   * - Returns a static string "Hello World!"
   *
   * Purpose:
   * - Used as a basic test endpoint
   * - Helps verify that the application is running correctly
   */
  getHello(): string {
    return 'Hello World!';
  }
}