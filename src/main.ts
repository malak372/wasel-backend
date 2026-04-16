import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Bootstrap Function
 * ------------------
 * Author: All Team Members
 *
 * Entry point of the NestJS application.
 *
 * Responsibilities:
 * - Create the application instance
 * - Apply global middleware and pipes
 * - Start the HTTP server
 *
 * Notes:
 * - This function is executed once when the application starts
 * - Controls the initialization lifecycle of the app
 */
async function bootstrap() {

  /**
   * Creates the NestJS application instance using AppModule.
   *
   * AppModule acts as the root module that wires all components together.
   */
  const app = await NestFactory.create(AppModule);

  /**
   * Global Validation Pipe
   * ----------------------
   * Applies validation rules to all incoming requests.
   *
   * Configuration:
   * - whitelist: true
   *   Removes properties not defined in DTOs
   *
   * - forbidNonWhitelisted: true
   *   Throws an error if extra unknown properties are provided
   *
   * - transform: true
   *   Automatically transforms payloads into DTO instances
   *
   * Purpose:
   * - Ensures data integrity and security
   * - Prevents unexpected or malicious input
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * Starts the application server.
   *
   * Configuration:
   * - Uses PORT from environment variables if available
   * - Defaults to port 3000 if not specified
   *
   * Behavior:
   * - Application begins listening for incoming HTTP requests
   */
  await app.listen(process.env.PORT ?? 3000);
}

/**
 * Executes the bootstrap function to start the application.
 */
bootstrap();