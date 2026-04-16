import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

/**
 * AuthModule
 * ----------
 * Author: Malak
 *
 * Module responsible for configuring and organizing all authentication
 * and authorization components within the application.
 *
 * This module integrates JWT-based authentication using Passport
 * and provides all required services, controllers, and guards
 * related to user authentication and role-based access control.
 *
 * Responsibilities:
 * - Registers JWT and Passport modules.
 * - Provides authentication business logic via AuthService.
 * - Exposes authentication endpoints through AuthController.
 * - Configures JWT strategy for token validation.
 * - Enables role-based authorization using RolesGuard.
 *
 * Imports:
 * - JwtModule: Used for generating and verifying JWT tokens.
 * - PassportModule: Provides authentication middleware support.
 *
 * Controllers:
 * - AuthController: Handles incoming HTTP requests for authentication.
 *
 * Providers:
 * - AuthService: Contains authentication logic (register, login, etc.).
 * - JwtStrategy: Validates JWT tokens and extracts user data.
 * - RolesGuard: Enforces role-based access control.
 *
 * Exports:
 * - AuthService: Allows other modules to use authentication logic.
 * - RolesGuard: Allows reuse of role-based authorization in other modules.
 *
 * Notes:
 * - JwtModule.register({}) can be extended with secret and expiration config.
 * - This module should be imported into the main application module.
 */
@Module({
  imports: [JwtModule.register({}), PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}