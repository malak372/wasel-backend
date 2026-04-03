import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class MergeReportDto {
  @IsUUID()
  targetReportId: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason?: string;
}