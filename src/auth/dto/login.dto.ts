import { IsEmail, IsString } from 'class-validator'; 


/**
 * LoginDto
 * ---------
 * Author: Malak
 *
 * Data Transfer Object (DTO) used for validating user login requests.
 *
 * This DTO defines the expected structure of the request body
 * when a user attempts to log in to the system.
 */
export class LoginDto {

  /**
   * email
   * -----
   * - Represents the user's email address.
   * - Used to identify the user during authentication.
   *
   * Validation Rules:
   * - Must be in a valid email format (e.g., user@example.com).
   */
  @IsEmail() // Ensures the value is a properly formatted email
  email: string; // Stores the email provided in the request body


  /**
   * password
   * --------
   * - Represents the user's password.
   * - Used to verify the user's identity.
   *
   * Validation Rules:
   * - Must be a string.
   */
  @IsString() 
  password: string; 
}