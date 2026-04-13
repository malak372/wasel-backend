import { Controller, Get, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll(@Req() req: any) {
    // Updated to use userId
    return this.alertsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    // Updated to use userId
    return this.alertsService.findOne(id, req.user.userId);
  }

  @Patch(':id/delivery-status')
  updateDeliveryStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateAlertDto
  ) {
    return this.alertsService.updateDeliveryStatus(id, updateDto);
  }
}