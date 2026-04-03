import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CitizenReportsService } from './citizen-reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { GetReportsQueryDto } from './dto/get-reports-query.dto';
import { ApproveReportDto } from './dto/approve-report.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { MergeReportDto } from './dto/merge-report.dto';
import { VoteReportDto } from './dto/vote-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/reports')
export class CitizenReportsController {
  constructor(private readonly citizenReportsService: CitizenReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  create(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  findAll(@Query() query: GetReportsQueryDto) {
    return this.citizenReportsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.findOne(id, user);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveReportDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.approve(id, dto, user);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectReportDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.reject(id, dto, user);
  }

  @Patch(':id/merge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  merge(
    @Param('id') id: string,
    @Body() dto: MergeReportDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.merge(id, dto, user);
  }

  @Post(':id/votes')
  @UseGuards(JwtAuthGuard)
  vote(
    @Param('id') id: string,
    @Body() dto: VoteReportDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.citizenReportsService.vote(id, dto, user);
  }
}