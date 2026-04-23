import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule
 * ------------
 * Author: Malak
 *
 * Global module responsible for providing database access using Prisma.
 *
 * This module registers the PrismaService as a global provider,
 * making it available across the entire application without the need
 * to import the module in every feature module.
 *
 * Responsibilities:
 * - Provides a centralized Prisma client instance.
 * - Enables database interaction across all modules.
 * - Ensures a single shared connection to the database.
 *
 * Global Scope:
 * - Marked with @Global(), allowing PrismaService to be injected
 *   in any module without explicitly importing PrismaModule.
 *
 * Providers:
 * - PrismaService: Encapsulates Prisma Client and handles database operations.
 *
 * Exports:
 * - PrismaService: Makes the service available for dependency injection
 *   throughout the application.
 *
 * Integration:
 * - Typically imported once in the root module (AppModule).
 * - Used by services to perform CRUD operations on the database.
 *
 * Notes:
 * - Promotes clean architecture by centralizing database logic.
 * - Avoids multiple PrismaClient instances, improving performance and stability.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}