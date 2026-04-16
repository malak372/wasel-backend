import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

/**
 * AuthController
 * --------------
 * Author: Malak
 *
 * Controller responsible for handling authentication-related operations.
 *
 * This controller exposes REST endpoints for:
 * - User registration
 * - User login
 * - Token refresh
 * - User logout
 * - Retrieving current authenticated user
 *
 * Base Route:
 * - api/v1/auth
 *
 * Dependencies:
 * - AuthService: Contains the business logic for authentication operations.
 * - DTOs: Used for validating incoming request payloads.
 * - JwtAuthGuard: Protects secured endpoints.
 * - CurrentUser decorator: Extracts authenticated user from request.
 */
@Controller('api/v1/auth')
export class AuthController {

  /**
   * Constructor
   * -----------
   * Injects AuthService to handle authentication logic.
   *
   * @param authService - Service responsible for authentication operations
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * register
   * --------
   * Handles user registration.
   *
   * @route POST /api/v1/auth/register
   * @param dto - Registration data validated by RegisterDto
   * @returns Newly created user or registration result
   *
   * Behavior:
   * - Receives user data (fullName, email, password, role).
   * - Delegates user creation to AuthService.
   */
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * login
   * -----
   * Handles user authentication.
   *
   * @route POST /api/v1/auth/login
   * @param dto - Login credentials validated by LoginDto
   * @returns Access token and refresh token
   *
   * Behavior:
   * - Validates user credentials.
   * - Generates JWT tokens upon successful authentication.
   */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * refresh
   * -------
   * Generates a new access token using a valid refresh token.
   *
   * @route POST /api/v1/auth/refresh
   * @param dto - Contains the refresh token
   * @returns New access token
   *
   * Behavior:
   * - Validates the refresh token.
   * - Issues a new access token if valid.
   */
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  /**
   * logout
   * ------
   * Logs out the user by invalidating the refresh token.
   *
   * @route POST /api/v1/auth/logout
   * @param dto - Contains the refresh token
   * @returns Logout confirmation
   *
   * Behavior:
   * - Revokes or deletes the refresh token.
   * - Prevents further token usage.
   */
  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto);
  }

  /**
   * me
   * ---
   * Retrieves the currently authenticated user.
   *
   * @route GET /api/v1/auth/me
   * @protected Requires JWT authentication
   * @param user - Extracted from request using CurrentUser decorator
   * @returns User data
   *
   * Behavior:
   * - Protected by JwtAuthGuard.
   * - Extracts user information from JWT.
   * - Fetches user details using AuthService.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { userId: string }) {
    return this.authService.me(user.userId);
  }
}