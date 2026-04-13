import { IsEnum } from 'class-validator';
import { AlertDeliveryStatus } from '@prisma/client';

export class UpdateAlertDto {
  @IsEnum(AlertDeliveryStatus)
  deliveryStatus: AlertDeliveryStatus;
}