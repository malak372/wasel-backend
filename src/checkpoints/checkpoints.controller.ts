import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CheckpointsService } from './checkpoints.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { UpdateCheckpointStatusDto } from './dto/update-checkpoint-status.dto';
import { ListCheckpointsQueryDto } from './dto/list-checkpoints-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type CurrentUserType = {
  userId: string;
  email: string;
  role: string;
};

@Controller('api/v1/checkpoints')
export class CheckpointsController {
  constructor(private readonly checkpointsService: CheckpointsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: ListCheckpointsQueryDto) {
    return this.checkpointsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkpointsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string) {
    return this.checkpointsService.getStatusHistory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Post()
  create(
    @Body() dto: CreateCheckpointDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.checkpointsService.create(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCheckpointDto) {
    return this.checkpointsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCheckpointStatusDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.checkpointsService.updateStatus(id, dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checkpointsService.remove(id);
  }
}