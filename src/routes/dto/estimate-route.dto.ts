import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RoutePointDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsLongitude()
  lng!: number;
}

export class EstimateRouteDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => RoutePointDto)
  origin!: RoutePointDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => RoutePointDto)
  destination!: RoutePointDto;

  @IsDefined()
  @Type(() => Boolean)
  @IsBoolean()
  avoidCheckpoints!: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  avoidAreas?: string[];
}