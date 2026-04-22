import { Module } from '@nestjs/common';
import { IncidentsResolver } from '../incidents/incidents.resolver';
import { CheckpointsResolver } from '../checkpoints/checkpoints.resolver';
import { ReportsResolver } from '../citizen-reports/report.resolver';
import { PrismaService } from '../prisma/prisma.service';

/**
 * GraphqlApiModule
 * ----------------
 * Author: Rahaf
 *
 * This module groups all GraphQL resolvers used in the Wasel backend.
 *
 * Purpose:
 * - Provide a centralized module for GraphQL-related functionality
 * - Register all resolvers responsible for read-only GraphQL queries
 * - Enable integration between GraphQL and Prisma database layer
 *
 * Included Resolvers:
 * - IncidentsResolver: Handles queries related to incidents
 * - CheckpointsResolver: Handles queries related to checkpoints
 * - ReportsResolver: Handles queries related to citizen reports
 *
 * Dependencies:
 * - PrismaService: Provides database access for all resolvers
 *
 * Notes:
 * - This module is part of the GraphQL bonus feature
 * - Only read operations (queries) are supported
 * - No mutations are included as per project requirements
 */
@Module({
  providers: [
    IncidentsResolver, 
    CheckpointsResolver, 
    ReportsResolver, 
    PrismaService
  ],
})
export class GraphqlApiModule {}