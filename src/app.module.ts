import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RoutesModule } from './routes/routes.module';
import { CheckpointsModule } from './checkpoints/checkpoints.module';
import { IncidentsModule } from './incidents/incidents.module';
import { CitizenReportsModule } from './citizen-reports/citizen-reports.module';

/**
 * AppModule
 * ---------
 * Author: All Team Members
 *
 * Root module of the application.
 *
 * Responsibilities:
 * - Bootstraps the entire NestJS application
 * - Registers global configurations
 * - Imports all feature modules
 * - Connects controllers and providers
 *
 * Architecture:
 * - Follows modular design
 * - Each feature is encapsulated in its own module
 * - Promotes scalability and maintainability
 */
@Module({
  imports: [

    /**
     * ConfigModule
     * ------------
     * Loads environment variables from .env file.
     *
     * Configuration:
     * - isGlobal: true → makes configuration available across all modules
     */
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    /**
     * ThrottlerModule
     * ----------------
     * Provides rate limiting to protect the application from abuse.
     *
     * Configuration:
     * - ttl: time window in milliseconds (60 seconds)
     * - limit: maximum number of requests per window
     *
     * Behavior:
     * - Limits each client to 10 requests per minute
     */
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),

    /**
     * PrismaModule
     * ------------
     * Provides database access using Prisma ORM.
     */
    PrismaModule,

    /**
     * AuthModule
     * ----------
     * Handles authentication and authorization:
     * - JWT authentication
     * - Login / Register / Refresh / Logout
     * - Role-based access control
     */
    AuthModule,

    /**
     * RoutesModule
     * ------------
     * Handles route estimation and navigation features.
     */
    RoutesModule,

    /**
     * CheckpointsModule
     * -----------------
     * Manages checkpoint data and status tracking.
     */
    CheckpointsModule,

    /**
     * IncidentsModule
     * ---------------
     * Manages incidents lifecycle:
     * - Create
     * - Verify
     * - Close
     */
    IncidentsModule,

    /**
     * CitizenReportsModule
     * ---------------------
     * Handles citizen-generated reports:
     * - Submit reports
     * - Voting system
     * - Moderation (approve, reject, merge)
     */
    CitizenReportsModule,
  ],

  /**
   * Controllers
   * -----------
   * Registers application-level controllers.
   */
  controllers: [AppController],

  /**
   * Providers
   * ---------
   * Registers application-level services.
   */
  providers: [AppService],
})
export class AppModule {}