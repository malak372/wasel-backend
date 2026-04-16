import { IsEmail, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';

/**
 * RegisterRole Enum
 * -----------------
 * Author: Malak
 *
 * Defines the allowed roles for user registration.
 * This enum is used to restrict role values to predefined options.
 */
export enum RegisterRole {
  citizen = 'citizen',    
  moderator = 'moderator', 
  admin = 'admin',         
}

/**
 * RegisterDto
 * -----------
 * Author: Malak
 *
 * Data Transfer Object (DTO) used for validating user registration requests.
 *
 * This class defines the structure and validation rules for incoming
 * registration data sent by the client.
 *
 * It works with NestJS ValidationPipe to ensure only valid data is processed.
 */
export class RegisterDto {

  /**
   * fullName
   * --------
   * - Must be a string.
   * - Represents the full name of the user.
   */
  @IsString()
  fullName: string; 


  /**
   * email
   * -----
   * - Must be a valid email format.
   * - Used as a unique identifier for the user.
   */
  @IsEmail() 
  email: string; 


  /**
   * password
   * --------
   * - Must be a string.
   * - Must be at least 6 characters long.
   * - Used for authentication.
   */
  @IsString() 
  @MinLength(6)
  password: string; 


  /**
   * role (optional)
   * ---------------
   * - Optional field.
   * - Must be one of the values defined in RegisterRole enum.
   * - If not provided, default role is typically assigned (e.g., citizen).
   */
  @IsOptional() 
  @IsEnum(RegisterRole)
  role?: RegisterRole; 
}