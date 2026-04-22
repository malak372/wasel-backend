import { Controller, Get, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * @class AlertsController
 * @description Controller responsible for handling incoming HTTP requests related to user alerts.
 * All endpoints within this controller are protected by JwtAuthGuard to ensure authorized access.
 */
@Controller('api/v1/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  /**
   * @param {AlertsService} alertsService - Injected service for alert-related business logic.
   */
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Retrieves all alerts associated with the authenticated user.
   * @route GET /api/v1/alerts
   * @param {any} req - The request object containing the authenticated user's payload.
   * @returns {Promise<any[]>} A list of alerts belonging to the specific user.
   */
  @Get()
  findAll(@Req() req: any) {
    // Passes the extracted userId from the JWT payload to the service
    return this.alertsService.findAll(req.user.userId);
  }

  /**
   * Retrieves a single alert by its unique identifier, ensuring it belongs to the authenticated user.
   * @route GET /api/v1/alerts/:id
   * @param {string} id - The unique identifier of the alert.
   * @param {any} req - The request object containing the authenticated user's payload.
   * @returns {Promise<any>} The requested alert details.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    // Validates alert ownership by passing userId along with the alert ID
    return this.alertsService.findOne(id, req.user.userId);
  }

  /**
   * Updates the delivery status (e.g., SENT, DELIVERED, READ) of a specific alert.
   * @route PATCH /api/v1/alerts/:id/delivery-status
   * @param {string} id - The unique identifier of the alert to update.
   * @param {UpdateAlertDto} updateDto - Data Transfer Object containing the new delivery status.
   * @returns {Promise<any>} The updated alert record.
   */
  @Patch(':id/delivery-status')
  updateDeliveryStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateAlertDto
  ) {
    return this.alertsService.updateDeliveryStatus(id, updateDto);
  }
}