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
 * A service responsible for handling authentication and session-related
 * operations in the Wasel backend system.
 *
 * This service manages:
 * - User registration
 * - User login
 * - Access token generation
 * - Refresh token generation and rotation
 * - Secure logout
 * - Returning the currently authenticated user
 *
 * It integrates:
 * - PrismaService for database access
 * - JwtService for token signing and verification
 * - bcrypt for password hashing and verification
 * - crypto hashing for secure refresh token storage
 *
 * Security Features:
 * - Passwords are hashed before storage
 * - Refresh tokens are hashed before being saved in the database
 * - Refresh tokens can be revoked and rotated
 * - Expired or invalid refresh tokens are rejected
 * - Inactive users are denied authentication
 */
@Injectable()
export class AuthService {

  /**
   * Constructor
   * -----------
   * Initializes the AuthService with required dependencies.
   *
   * @param prisma - Prisma service used for database operations
   * @param jwtService - JWT service used for signing and verifying tokens
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * sanitizeUser
   * ------------
   * Returns a safe user object without exposing sensitive fields
   * such as password hashes or internal authentication data.
   *
   * @param user - Raw user object retrieved from the database
   * @returns SafeUser - Sanitized user object safe for API responses
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
   * Hashes a refresh token using SHA-256 before storing it in the database.
   *
   * Purpose:
   * - Prevent raw refresh tokens from being stored directly
   * - Improve session security in case of database exposure
   *
   * @param token - Raw refresh token
   * @returns string - SHA-256 hashed token
   */
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * parseRefreshExpiryToDate
   * ------------------------
   * Converts the refresh token expiration configuration value
   * into an absolute expiration Date.
   *
   * Supported units:
   * - s = seconds
   * - m = minutes
   * - h = hours
   * - d = days
   *
   * Behavior:
   * - Reads JWT_REFRESH_EXPIRES_IN from environment variables
   * - Falls back to 7 days if the value is missing or invalid
   *
   * @returns Date - Calculated expiration timestamp
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
   * Generates a new access token and refresh token for the given user.
   *
   * Payload includes:
   * - User ID
   * - User email
   * - User role
   *
   * Behavior:
   * - Reads JWT secrets from environment variables
   * - Signs an access token using the access secret
   * - Signs a refresh token using the refresh secret
   * - Applies configured expiration values
   *
   * @param user - User data required for token payload generation
   * @returns Object containing accessToken and refreshToken
   *
   * Throws:
   * - Error if JWT secrets are not configured
   */
  private async generateTokens(user: { id: string; email: string; role: string }) {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  /**
   * register
   * --------
   * Creates a new user account and immediately issues authentication tokens.
   *
   * Process:
   * 1. Checks whether the email already exists
   * 2. Hashes the provided password
   * 3. Creates the user in the database
   * 4. Generates access and refresh tokens
   * 5. Stores the hashed refresh token with expiration metadata
   * 6. Returns the sanitized user and tokens
   *
   * @param dto - Registration request data
   * @returns Object containing user data and issued tokens
   *
   * Throws:
   * - BadRequestException if email already exists
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
   * Authenticates an existing user using email and password.
   *
   * Process:
   * 1. Looks up the user by email
   * 2. Verifies that the account exists and is active
   * 3. Compares the provided password with the stored hash
   * 4. Generates new access and refresh tokens
   * 5. Stores the hashed refresh token in the database
   * 6. Returns the sanitized user and tokens
   *
   * @param dto - Login request data
   * @returns Object containing user data and issued tokens
   *
   * Throws:
   * - UnauthorizedException if credentials are invalid
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
   * Issues a new access token and refresh token using a valid refresh token.
   *
   * Process:
   * 1. Verifies the provided refresh token signature
   * 2. Hashes the token and looks it up in the database
   * 3. Ensures the token exists, is not revoked, and is not expired
   * 4. Confirms that the token belongs to the expected user
   * 5. Generates a new token pair
   * 6. Revokes the old refresh token
   * 7. Stores the new hashed refresh token
   *
   * This implements refresh token rotation for improved security.
   *
   * @param dto - Refresh request containing the refresh token
   * @returns Object containing a new access token and refresh token
   *
   * Throws:
   * - UnauthorizedException if token is invalid, missing, revoked, expired, or mismatched
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

    const storedToken = await this.prisma.refreshToken.findFirst({
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
   * Revokes a stored refresh token to terminate the user session.
   *
   * Process:
   * 1. Hashes the provided refresh token
   * 2. Looks up the token in the database
   * 3. If found, marks it as revoked
   * 4. If not found, returns a safe response without failing
   *
   * @param dto - Logout request containing the refresh token
   * @returns Object containing a logout status message
   */
  async logout(dto: RefreshDto) {
    const tokenHash = this.hashRefreshToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
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
   * Returns the currently authenticated user's safe profile information.
   *
   * Process:
   * 1. Looks up the user by ID
   * 2. Ensures the user exists and is active
   * 3. Returns the sanitized user object
   *
   * @param userId - Authenticated user's ID
   * @returns SafeUser - Sanitized current user data
   *
   * Throws:
   * - UnauthorizedException if the user does not exist or is inactive
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