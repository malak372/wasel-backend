import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAlertDto } from './dto/update-alert.dto';

/**
 * @class AlertsService
 * @description Service responsible for managing the lifecycle and retrieval of system alerts.
 * This service handles database operations for alerts, including filtering by user ownership
 * and updating real-time delivery statuses.
 */
@Injectable()
export class AlertsService {
  /**
   * @param {PrismaService} prisma - The injected Prisma service for database interactions.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches all alerts belonging to a specific user based on their active subscriptions.
   * Results are sorted by creation date in descending order.
   * * @param {string} userId - The unique identifier of the authenticated user.
   * @returns {Promise<any[]>} A list of alerts with associated incident details.
   */
  async findAll(userId: string) {
    return this.prisma.alert.findMany({
      where: {
        subscription: { userId }
      },
      include: {
        incident: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Retrieves a specific alert by ID, ensuring it belongs to the requesting user.
   * * @param {string} id - The unique identifier of the alert.
   * @param {string} userId - The unique identifier of the user to verify ownership.
   * @throws {NotFoundException} If the alert does not exist or the user is not authorized to view it.
   * @returns {Promise<any>} The found alert record including incident details.
   */
  async findOne(id: string, userId: string) {
    const alert = await this.prisma.alert.findFirst({
      where: {
        id,
        subscription: { userId }
      },
      include: {
        incident: true
      }
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return alert;
  }

  /**
   * Updates the delivery tracking status of an alert and sets timestamps accordingly.
   * * @param {string} id - The unique identifier of the alert to update.
   * @param {UpdateAlertDto} updateDto - The data containing the new delivery status.
   * @throws {NotFoundException} If the specified alert does not exist.
   * @returns {Promise<any>} The updated alert record.
   */
  async updateDeliveryStatus(id: string, updateDto: UpdateAlertDto) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return this.prisma.alert.update({
      where: { id },
      data: {
        deliveryStatus: updateDto.deliveryStatus,
        /** Automatically sets the 'sentAt' timestamp if the status is transitioned to 'sent' */
        sentAt: updateDto.deliveryStatus === 'sent' ? new Date() : null
      }
    });
  }
}