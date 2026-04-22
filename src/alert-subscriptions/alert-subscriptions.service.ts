import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateAlertSubscriptionDto } from './dto/create-alert-subscription.dto';
import { UpdateAlertSubscriptionDto } from './dto/update-alert-subscription.dto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * @class AlertSubscriptionsService
 * @description Service layer handling the business logic for managing alert subscriptions.
 * It interacts directly with the database via Prisma to perform CRUD operations.
 */
@Injectable()
export class AlertSubscriptionsService {
  /**
   * @param {PrismaService} prisma - The injected Prisma service for database connectivity.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new alert subscription for a specific user.
   * Handles unique constraint violations (Prisma code P2002).
   * * @param {CreateAlertSubscriptionDto} createDto - The subscription details (region and category).
   * @param {string} userId - The unique identifier of the user creating the subscription.
   * @throws {ConflictException} If the user is already subscribed to the same region and category.
   * @returns {Promise<any>} The newly created alert subscription record.
   */
  async create(createDto: CreateAlertSubscriptionDto, userId: string) {
    try {
      return await this.prisma.alertSubscription.create({
        data: {
          userId,
          regionId: createDto.regionId,
          categoryId: createDto.categoryId,
        },
      });
    } catch (error) {
      /** Check for Prisma Unique Constraint violation */
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You are already subscribed to this region/category.');
      }
      throw error;
    }
  }

  /**
   * Retrieves all alert subscriptions belonging to a specific user.
   * Includes related region and category data.
   * * @param {string} userId - The unique identifier of the user.
   * @returns {Promise<any[]>} A list of subscriptions with nested region and category details.
   */
  async findAll(userId: string) {
    return this.prisma.alertSubscription.findMany({
      where: { userId },
      include: {
        region: true,
        category: true,
      },
    });
  }

  /**
   * Updates an existing alert subscription.
   * * @param {string} id - The unique identifier of the subscription to update.
   * @param {UpdateAlertSubscriptionDto} updateDto - The data to be updated.
   * @param {string} userId - The user ID to verify ownership.
   * @throws {NotFoundException} If the subscription does not exist or does not belong to the user.
   * @returns {Promise<any>} The updated subscription record.
   */
  async update(id: string, updateDto: UpdateAlertSubscriptionDto, userId: string) {
    const subscription = await this.prisma.alertSubscription.findUnique({ where: { id } });
    
    if (!subscription || subscription.userId !== userId) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.alertSubscription.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * Deletes an existing alert subscription.
   * * @param {string} id - The unique identifier of the subscription to remove.
   * @param {string} userId - The user ID to verify ownership.
   * @throws {NotFoundException} If the subscription does not exist or does not belong to the user.
   * @returns {Promise<any>} The deleted subscription record confirmation.
   */
  async remove(id: string, userId: string) {
    const subscription = await this.prisma.alertSubscription.findUnique({ where: { id } });
    
    if (!subscription || subscription.userId !== userId) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.alertSubscription.delete({
      where: { id },
    });
  }
}