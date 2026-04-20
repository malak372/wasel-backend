import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 * -------------
 * Author: All Team Members
 *
 * A centralized database service that extends PrismaClient
 * and integrates it with the NestJS application lifecycle.
 *
 * This service is responsible for:
 * - Establishing a connection to the database when the application starts
 * - Gracefully closing the connection when the application shuts down
 * - Providing a shared Prisma client instance across the application
 *
 * Responsibilities:
 * - Acts as a single source of truth for database access
 * - Enables dependency injection of Prisma into other services and resolvers
 * - Manages connection lifecycle automatically
 *
 * Lifecycle Hooks:
 * - onModuleInit: Called when the module is initialized
 * - onModuleDestroy: Called when the application is shutting down
 *
 * Notes:
 * - Extends PrismaClient to expose all Prisma query methods
 * - Used across services (Auth, Reports, Routes, etc.)
 * - Ensures efficient connection handling in NestJS environment
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{

  /**
   * onModuleInit
   * ------------
   * Establishes a database connection when the module initializes.
   *
   * Called automatically by NestJS during application startup.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * onModuleDestroy
   * ----------------
   * Closes the database connection when the module is destroyed.
   *
   * Called automatically by NestJS during application shutdown.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}