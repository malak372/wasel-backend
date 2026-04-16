import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

/**
 * JwtStrategy
 * -----------
 * Author: Malak
 *
 * Custom JWT authentication strategy built using Passport.js and integrated with NestJS.
 *
 * This strategy is responsible for validating JSON Web Tokens (JWT) sent by clients
 * and extracting the authenticated user information from the token payload.
 *
 * It works in conjunction with JwtAuthGuard to secure protected routes.
 *
 * Responsibilities:
 * - Extract JWT from incoming HTTP requests.
 * - Validate the token using a secret key.
 * - Decode the payload and attach user data to request.user.
 *
 * Dependencies:
 * - passport-jwt Strategy
 * - JWT_ACCESS_SECRET environment variable
 *
 * Token Source:
 * - Authorization header in the format: Bearer <token>
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  /**
   * Constructor
   * -----------
   * Configures the JWT strategy.
   *
   * Process:
   * - Reads the JWT secret from environment variables.
   * - Throws an error if the secret is not defined.
   * - Defines how the JWT should be extracted from requests.
   * - Sets validation options such as expiration handling.
   *
   * Configuration:
   * - jwtFromRequest: Extracts token from Authorization header.
   * - ignoreExpiration: Ensures expired tokens are rejected.
   * - secretOrKey: Secret key used to verify token signature.
   */
  constructor() {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * validate
   * --------
   * Validates the decoded JWT payload.
   *
   * @param payload - Decoded JWT payload containing user information
   * @returns Object representing the authenticated user
   *
   * Behavior:
   * - Called automatically after the token is successfully verified.
   * - Extracts relevant fields from the payload.
   * - Returns a user object that will be attached to request.user.
   *
   * Returned Object:
   * - userId: Unique identifier of the user (mapped from payload.sub)
   * - email: User email address
   * - role: User role used for authorization (e.g., RBAC)
   */
  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}