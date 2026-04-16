import { IsString } from 'class-validator'; 

/**
 * RefreshDto
 * ----------
 * Author: Malak
 *
 * Data Transfer Object (DTO) used for handling token refresh requests.
 *
 * This DTO validates the incoming request body when the client
 * sends a refresh token to obtain a new access token.
 */
export class RefreshDto {

  /**
   * refreshToken
   * ------------
   * - Represents the refresh token sent by the client.
   * - Used to generate a new access token after the old one expires.
   *
   * Validation Rules:
   * - Must be of type string.
   */
  @IsString() 
  refreshToken: string;
}