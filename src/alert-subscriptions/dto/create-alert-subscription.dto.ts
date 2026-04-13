import { IsOptional, IsUUID } from 'class-validator';

export class CreateAlertSubscriptionDto {
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}