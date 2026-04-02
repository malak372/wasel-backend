import { CheckpointStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCheckpointStatusDto {
  @IsEnum(CheckpointStatus)
  status: CheckpointStatus;

  @IsOptional()
  @IsString()
  note?: string;
}