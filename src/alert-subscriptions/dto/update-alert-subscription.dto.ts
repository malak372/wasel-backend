import { PartialType } from '@nestjs/mapped-types';
import { CreateAlertSubscriptionDto } from './create-alert-subscription.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAlertSubscriptionDto extends PartialType(CreateAlertSubscriptionDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}