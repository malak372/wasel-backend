import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

/**
 * SafeUser
 * --------
 * Author: Malak
 *
 * A lightweight user representation used for returning user data
 * without exposing sensitive fields such as password hashes.
 *
 * Fields:
 * - id: Unique user identifier.
 * - fullName: Full name of the user.
 * - email: User email address.
 * - role: Assigned user role.
 * - isActive: Indicates whether the account is active.
 */
type SafeUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
};

/**
 * AuthService
 * -----------
 * Author: Malak
 *
 * Service responsible for handling authentication and user session management.
 *
 * This service provides the core business logic for:
 * - User registration
 * - User login
 * - Token generation
 * - Refresh token validation and rotation
 * - User logout
 * - Fetching authenticated user profile
 *
 * Dependencies:
 * - PrismaService: Handles database operations.
 * - JwtService: Used to generate and verify JWT tokens.
 *
 * Security Features:
 * - Password hashing using bcrypt.
 * - Refresh token hashing using SHA-256 before database storage.
 * - Refresh token revocation support.
 * - Token expiration handling.
 */
@Injectable()
export class AuthService {
  /**
   * Constructor
   * -----------
   * Injects required services for authentication operations.
   *
   * @param prisma - Prisma service used for database access
   * @param jwtService - JWT service used for signing and verifying tokens
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * sanitizeUser
   * ------------
   * Converts a full user object into a safe user object that excludes
   * sensitive fields such as passwordHash.
   *
   * @param user - Raw user object retrieved from the database
   * @returns SafeUser - Sanitized user data suitable for API responses
   *
   * Purpose:
   * - Prevents sensitive internal fields from being exposed to clients.
   */
  private sanitizeUser(user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
  }): SafeUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }

  /**
   * hashRefreshToken
   * ----------------
   * Generates a SHA-256 hash for a refresh token before storing it in the database.
   *
   * @param token - Raw refresh token
   * @returns string - Hashed token value
   *
   * Purpose:
   * - Improves security by avoiding storage of raw refresh tokens.
   */
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * parseRefreshExpiryToDate
   * ------------------------
   * Converts the refresh token expiration configuration value
   * into an absolute Date object.
   *
   * @returns Date - Expiration date for the refresh token
   *
   * Behavior:
   * - Reads JWT_REFRESH_EXPIRES_IN from environment variables.
   * - Supports values with units: s, m, h, d.
   * - Falls back to 7 days if the value is missing or invalid.
   *
   * Purpose:
   * - Ensures refresh tokens are stored with an exact expiration timestamp.
   */
  private parseRefreshExpiryToDate(): Date {
    const fallbackMs = 7 * 24 * 60 * 60 * 1000;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

    const match = /^(\d+)([smhd])$/.exec(expiresIn);

    if (!match) {
      return new Date(Date.now() + fallbackMs);
    }

    const value = Number(match[1]);
    const unit = match[2];

    const unitMsMap: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * unitMsMap[unit]);
  }

  /**
   * generateTokens
   * --------------
   * Generates both access and refresh JWT tokens for a given user.
   *
   * @param user - User identity data required to build the token payload
   * @returns Promise<{ accessToken: string; refreshToken: string }>
   *
   * Behavior:
   * - Reads access and refresh JWT secrets from environment variables.
   * - Builds a payload containing:
   *   - sub: user id
   *   - email: user email
   *   - role: user role
   * - Signs an access token with JWT_ACCESS_SECRET.
   * - Signs a refresh token with JWT_REFRESH_SECRET.
   *
   * Throws:
   * - Error if JWT secrets are not configured.
   *
   * Purpose:
   * - Centralizes token generation logic in one reusable method.
   */
  private async generateTokens(user: { id: string; email: string; role: string }) {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const accessExpiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as
      | number
      | `${number}ms`
      | `${number}s`
      | `${number}m`
      | `${number}h`
      | `${number}d`;

    const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as
      | number
      | `${number}ms`
      | `${number}s`
      | `${number}m`
      | `${number}h`
      | `${number}d`;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * register
   * --------
   * Creates a new user account and generates authentication tokens.
   *
   * @param dto - Registration data validated by RegisterDto
   * @returns Object containing sanitized user data and generated tokens
   *
   * Behavior:
   * - Checks whether the email already exists.
   * - Hashes the provided password using bcrypt.
   * - Creates a new user record in the database.
   * - Assigns a default role of 'citizen' if no role is provided.
   * - Generates access and refresh tokens.
   * - Stores the hashed refresh token with its expiration date.
   *
   * Throws:
   * - BadRequestException if the email is already registered.
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: dto.role ?? 'citizen',
        isActive: true,
      },
    });

    const tokens = await this.generateTokens(user);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(tokens.refreshToken),
        expiresAt: this.parseRefreshExpiryToDate(),
      },
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * login
   * -----
   * Authenticates a user using email and password, then issues new tokens.
   *
   * @param dto - Login credentials validated by LoginDto
   * @returns Object containing sanitized user data and generated tokens
   *
   * Behavior:
   * - Retrieves the user by email.
   * - Verifies that the account exists and is active.
   * - Compares the provided password with the stored password hash.
   * - Generates access and refresh tokens.
   * - Stores the hashed refresh token in the database.
   *
   * Throws:
   * - UnauthorizedException if credentials are invalid.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(tokens.refreshToken),
        expiresAt: this.parseRefreshExpiryToDate(),
      },
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * refresh
   * -------
   * Validates a refresh token and rotates it by issuing a new token pair.
   *
   * @param dto - Object containing the refresh token
   * @returns Object containing new access and refresh tokens
   *
   * Behavior:
   * - Verifies the refresh token using JWT_REFRESH_SECRET.
   * - Hashes the provided token and looks it up in the database.
   * - Ensures the token exists, is not revoked, and is not expired.
   * - Confirms the token belongs to the same user in the JWT payload.
   * - Generates a new access token and refresh token.
   * - Revokes the old refresh token.
   * - Stores the new hashed refresh token.
   *
   * Throws:
   * - UnauthorizedException if token validation fails for any reason.
   *
   * Security Note:
   * - Implements refresh token rotation to reduce replay risk.
   */
  async refresh(dto: RefreshDto) {
    let payload: { sub: string; email: string; role: string };

    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashRefreshToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (storedToken.userId !== payload.sub) {
      throw new UnauthorizedException('Refresh token user mismatch');
    }

    const tokens = await this.generateTokens(storedToken.user);

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
      },
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: this.hashRefreshToken(tokens.refreshToken),
        expiresAt: this.parseRefreshExpiryToDate(),
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * logout
   * ------
   * Logs out a user by revoking the provided refresh token.
   *
   * @param dto - Object containing the refresh token
   * @returns Message indicating logout result
   *
   * Behavior:
   * - Hashes the provided refresh token.
   * - Searches for the matching stored token.
   * - If found, marks it as revoked.
   * - If not found, returns a message indicating it was already invalid or removed.
   *
   * Purpose:
   * - Prevents future use of the refresh token after logout.
   */
  async logout(dto: RefreshDto) {
    const tokenHash = this.hashRefreshToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      return { message: 'Token not found or already logged out' };
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * me
   * --
   * Retrieves the profile of the currently authenticated user.
   *
   * @param userId - Unique identifier of the authenticated user
   * @returns SafeUser - Sanitized user profile
   *
   * Behavior:
   * - Looks up the user by id.
   * - Ensures the account exists and is active.
   * - Returns safe user information only.
   *
   * Throws:
   * - UnauthorizedException if the user does not exist or is inactive.
   */
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }
}