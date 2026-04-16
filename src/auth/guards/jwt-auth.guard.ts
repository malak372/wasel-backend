import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard
 * ------------
 * Author: Malak
 *
 * A custom authentication guard that extends NestJS Passport AuthGuard
 * using the 'jwt' strategy.
 *
 * This guard is responsible for protecting routes by validating
 * JSON Web Tokens (JWT) provided in incoming HTTP requests.
 *
 * Functionality:
 * - Extracts the JWT from the Authorization header.
 * - Delegates validation to the configured 'jwt' strategy.
 * - If the token is valid, attaches the decoded payload to request.user.
 * - If the token is missing or invalid, denies access with a 401 Unauthorized response.
 *
 * Integration:
 * - Works with JwtStrategy (passport-jwt).
 * - Commonly used alongside custom decorators like CurrentUser.
 *
 * Usage:
 * ```ts
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user) {
 *   return user;
 * }
 * ```
 *
 * Notes:
 * - Requires a properly configured JWT strategy.
 * - Expects the token in the format: Authorization: Bearer <token>.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}