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

/**
 * RoutePointDto
 * -------------
 * Author: Eman
 *
 * Data Transfer Object representing a geographic point
 * used in route estimation.
 *
 * Fields:
 * - name: Human-readable name of the location
 * - lat: Latitude coordinate (validated)
 * - lng: Longitude coordinate (validated)
 *
 * Validation:
 * - name must be a non-empty string
 * - lat must be a valid latitude value
 * - lng must be a valid longitude value
 */
class RoutePointDto {

  /**
   * Name of the location.
   */
  @IsString()
  @IsNotEmpty()
  name!: string;

  /**
   * Latitude coordinate.
   */
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  /**
   * Longitude coordinate.
   */
  @Type(() => Number)
  @IsLongitude()
  lng!: number;
}

/**
 * EstimateRouteDto
 * ----------------
 * Author: Eman
 *
 * Data Transfer Object used to request route estimation.
 *
 * This DTO defines the required input for calculating a route
 * between two points with optional avoidance preferences.
 *
 * Fields:
 * - origin: Starting point of the route
 * - destination: Ending point of the route
 * - avoidCheckpoints: Whether to avoid checkpoints in routing
 * - avoidAreas: Optional list of area names to avoid
 *
 * Validation:
 * - origin and destination must be valid RoutePointDto objects
 * - avoidCheckpoints must be a boolean value
 * - avoidAreas must be an array of strings (max 20 items)
 *
 * Notes:
 * - Used in route estimation endpoints
 * - Ensures clean and validated input before processing
 */
export class EstimateRouteDto {

  /**
   * Origin point of the route.
   */
  @IsDefined()
  @ValidateNested()
  @Type(() => RoutePointDto)
  origin!: RoutePointDto;

  /**
   * Destination point of the route.
   */
  @IsDefined()
  @ValidateNested()
  @Type(() => RoutePointDto)
  destination!: RoutePointDto;

  /**
   * Flag indicating whether checkpoints should be avoided.
   */
  @IsDefined()
  @Type(() => Boolean)
  @IsBoolean()
  avoidCheckpoints!: boolean;

  /**
   * Optional list of area names to avoid.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  avoidAreas?: string[];
}