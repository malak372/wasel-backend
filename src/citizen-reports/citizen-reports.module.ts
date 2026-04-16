import { Module } from '@nestjs/common';
import { CitizenReportsController } from './citizen-reports.controller';
import { CitizenReportsService } from './citizen-reports.service';

@Module({
  controllers: [CitizenReportsController],
  providers: [CitizenReportsService],
  exports: [CitizenReportsService],
})
export class CitizenReportsModule {}