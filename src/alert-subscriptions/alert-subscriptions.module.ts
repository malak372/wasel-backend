import { Module } from '@nestjs/common';
import { AlertSubscriptionsService } from './alert-subscriptions.service';
import { AlertSubscriptionsController } from './alert-subscriptions.controller';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [PrismaModule],
  controllers: [AlertSubscriptionsController],
  providers: [AlertSubscriptionsService],
})
export class AlertSubscriptionsModule {}