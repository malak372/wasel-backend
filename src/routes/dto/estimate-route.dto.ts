import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RoutePointDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @Type(() => Number)
  @IsLongitude()
  lng: number;
}

export class EstimateRouteDto {
  @ValidateNested()
  @Type(() => RoutePointDto)
  origin: RoutePointDto;

  @ValidateNested()
  @Type(() => RoutePointDto)
  destination: RoutePointDto;

  @IsBoolean()
  avoidCheckpoints: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  avoidAreas?: string[];
}