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
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { VerifyIncidentDto } from './dto/verify-incident.dto';
import { CloseIncidentDto } from './dto/close-incident.dto';
import { RejectIncidentDto } from './dto/reject-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type CurrentUserType = {
  userId: string;
  email: string;
  role: string;
};

@Controller('api/v1/incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: ListIncidentsQueryDto) {
    return this.incidentsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string) {
    return this.incidentsService.getStatusHistory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Post()
  create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.incidentsService.create(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id/verify')
  verify(
    @Param('id') id: string,
    @Body() dto: VerifyIncidentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.incidentsService.verify(id, dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id/close')
  close(
    @Param('id') id: string,
    @Body() dto: CloseIncidentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.incidentsService.close(id, dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectIncidentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.incidentsService.reject(id, dto, user.userId);
  }
}