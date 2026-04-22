import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AlertSubscriptionsService } from './alert-subscriptions.service';
import { CreateAlertSubscriptionDto } from './dto/create-alert-subscription.dto';
import { UpdateAlertSubscriptionDto } from './dto/update-alert-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Type definition for the authenticated user payload extracted from the JWT.
 */
type UserPayload = {
  userId: string;
  email: string;
  role: string;
};

/**
 * @class AlertSubscriptionsController
 * @description Controller responsible for managing user alert subscriptions.
 * All routes are protected by JwtAuthGuard and prefixed with 'api/v1/alerts/subscriptions'.
 */
@Controller('api/v1/alerts/subscriptions')
@UseGuards(JwtAuthGuard)
export class AlertSubscriptionsController {
  /**
   * @param {AlertSubscriptionsService} alertSubscriptionsService - Injected service for alert subscription logic.
   */
  constructor(private readonly alertSubscriptionsService: AlertSubscriptionsService) {}

  /**
   * Creates a new alert subscription for the authenticated user.
   * @route POST /api/v1/alerts/subscriptions
   * @param {CreateAlertSubscriptionDto} createDto - Data Transfer Object for creating a subscription.
   * @param {UserPayload} user - The current authenticated user.
   * @returns {Promise<any>} The created subscription record.
   */
  @Post()
  create(
    @Body() createDto: CreateAlertSubscriptionDto, 
    @CurrentUser() user: UserPayload
  ) {
    return this.alertSubscriptionsService.create(createDto, user.userId);
  }

  /**
   * Retrieves all alert subscriptions belonging to the authenticated user.
   * @route GET /api/v1/alerts/subscriptions
   * @param {UserPayload} user - The current authenticated user.
   * @returns {Promise<any[]>} A list of alert subscriptions.
   */
  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.alertSubscriptionsService.findAll(user.userId);
  }

  /**
   * Updates an existing alert subscription by ID.
   * @route PATCH /api/v1/alerts/subscriptions/:id
   * @param {string} id - The unique identifier of the subscription.
   * @param {UpdateAlertSubscriptionDto} updateDto - Data Transfer Object for updating a subscription.
   * @param {UserPayload} user - The current authenticated user.
   * @returns {Promise<any>} The updated subscription record.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAlertSubscriptionDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.alertSubscriptionsService.update(id, updateDto, user.userId);
  }

  /**
   * Deletes a specific alert subscription by ID.
   * @route DELETE /api/v1/alerts/subscriptions/:id
   * @param {string} id - The unique identifier of the subscription.
   * @param {UserPayload} user - The current authenticated user.
   * @returns {Promise<any>} A confirmation of the deletion.
   */
  @Delete(':id')
  remove(
    @Param('id') id: string, 
    @CurrentUser() user: UserPayload
  ) {
    return this.alertSubscriptionsService.remove(id, user.userId);
  }
}