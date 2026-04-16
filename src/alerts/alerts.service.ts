import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async updateDeliveryStatus(id: string, updateDto: UpdateAlertDto) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return this.prisma.alert.update({
      where: { id },
      data: {
        deliveryStatus: updateDto.deliveryStatus,
        sentAt: updateDto.deliveryStatus === 'sent' ? new Date() : null
      }
    });
  }
}