import { IsOptional, IsString } from 'class-validator';

export class CloseIncidentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}