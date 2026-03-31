import { IsString } from 'class-validator';

export class RejectIncidentDto {
  @IsString()
  reason: string;
}