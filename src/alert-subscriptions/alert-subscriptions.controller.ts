import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AlertSubscriptionsService } from './alert-subscriptions.service';
import { CreateAlertSubscriptionDto } from './dto/create-alert-subscription.dto';
import { UpdateAlertSubscriptionDto } from './dto/update-alert-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type UserPayload = {
  userId: string;
  email: string;
  role: string;
};

@Controller('api/v1/alerts/subscriptions')
@UseGuards(JwtAuthGuard)
export class AlertSubscriptionsController {
  constructor(private readonly alertSubscriptionsService: AlertSubscriptionsService) {}

  @Post()
  create(
    @Body() createDto: CreateAlertSubscriptionDto, 
    @CurrentUser() user: UserPayload
  ) {
    return this.alertSubscriptionsService.create(createDto, user.userId);
  }

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.alertSubscriptionsService.findAll(user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAlertSubscriptionDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.alertSubscriptionsService.update(id, updateDto, user.userId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string, 
    @CurrentUser() user: UserPayload
  ) {
    return this.alertSubscriptionsService.remove(id, user.userId);
  }
}