import { IsOptional, IsString } from 'class-validator';

export class VerifyIncidentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}