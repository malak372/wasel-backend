import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService
 * -------------
 * Author: All Team Members
 *
 * Service responsible for managing database connectivity using Prisma ORM.
 *
 * This service extends PrismaClient and integrates a PostgreSQL connection
 * pool using the PrismaPg adapter. It ensures efficient database access
 * and proper lifecycle management within the NestJS application.
 *
 * Responsibilities:
 * - Initializes Prisma Client with a PostgreSQL adapter.
 * - Manages database connection pooling.
 * - Handles application lifecycle hooks (startup and shutdown).
 * - Provides a single shared database connection across the application.
 *
 * Dependencies:
 * - ConfigService: Used to retrieve environment variables.
 * - PrismaClient: ORM for database operations.
 * - pg Pool: Handles PostgreSQL connection pooling.
 * - PrismaPg: Adapter connecting Prisma to pg Pool.
 *
 * Notes:
 * - Uses SSL configuration for secure database connections.
 * - Prevents multiple Prisma instances by centralizing access.
 * - Ensures clean shutdown of database connections.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  /**
   * pool
   * ----
   * PostgreSQL connection pool instance.
   *
   * Used to manage multiple database connections efficiently.
   */
  private readonly pool: Pool;

  /**
   * Constructor
   * -----------
   * Initializes PrismaClient with a PostgreSQL adapter and connection pool.
   *
   * @param configService - Service used to access environment variables
   *
   * Behavior:
   * - Retrieves DATABASE_URL from environment variables.
   * - Throws an error if DATABASE_URL is not defined.
   * - Creates a PostgreSQL connection pool.
   * - Initializes PrismaPg adapter using the pool.
   * - Passes the adapter to PrismaClient.
   */
  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });

    this.pool = pool;
  }

  /**
   * onModuleInit
   * ------------
   * Lifecycle hook triggered when the module is initialized.
   *
   * Behavior:
   * - Establishes a connection to the database.
   *
   * Purpose:
   * - Ensures the database is ready before handling requests.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * onModuleDestroy
   * ---------------
   * Lifecycle hook triggered when the application is shutting down.
   *
   * Behavior:
   * - Disconnects Prisma client from the database.
   * - Closes the PostgreSQL connection pool.
   *
   * Purpose:
   * - Prevents memory leaks and open connections.
   * - Ensures graceful shutdown of the application.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}