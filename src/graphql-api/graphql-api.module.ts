import { Module } from '@nestjs/common';
import { IncidentsResolver } from '../incidents/incidents.resolver';
import { CheckpointsResolver } from '../checkpoints/checkpoints.resolver';
import { ReportsResolver } from '../citizen-reports/report.resolver';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [
    IncidentsResolver, 
    CheckpointsResolver, 
    ReportsResolver, 
    PrismaService
  ],
})
export class GraphqlApiModule {}