import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { EstimateRouteDto } from './dto/estimate-route.dto';
import { GetRoutesQueryDto } from './dto/get-routes-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/routes')
@UseGuards(JwtAuthGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post('estimate')
  estimateRoute(
    @Body() dto: EstimateRouteDto,
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    return this.routesService.estimateRoute(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: { userId: string; email: string; role: string },
    @Query() query: GetRoutesQueryDto,
  ) {
    return this.routesService.findAll(user, query);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    return this.routesService.findOne(id, user);
  }
}