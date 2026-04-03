import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class GetReportsQueryDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'merged'])
  status?: 'pending' | 'approved' | 'rejected' | 'merged';

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsUUID()
  incidentId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  from?: string;

  @IsOptional()
  to?: string;

  @IsOptional()
  @IsIn(['createdAt', 'reportTime', 'confidenceScore'])
  sortBy?: 'createdAt' | 'reportTime' | 'confidenceScore';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}