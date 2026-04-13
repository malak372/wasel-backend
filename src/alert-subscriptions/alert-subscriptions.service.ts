import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateAlertSubscriptionDto } from './dto/create-alert-subscription.dto';
import { UpdateAlertSubscriptionDto } from './dto/update-alert-subscription.dto';
import { PrismaService } from '../prisma/prisma.service'; // تأكد أن هذا المسار صحيح لملف الـ PrismaService عندك

@Injectable()
export class AlertSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

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
      // Prisma error code P2002 means Unique constraint failed
      if (error.code === 'P2002') {
        throw new ConflictException('You are already subscribed to this region/category.');
      }
      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.alertSubscription.findMany({
      where: { userId },
      include: {
        region: true,
        category: true,
      },
    });
  }

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