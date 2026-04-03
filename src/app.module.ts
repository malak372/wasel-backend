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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    RoutesModule,
    CheckpointsModule,
    IncidentsModule,
    CitizenReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}