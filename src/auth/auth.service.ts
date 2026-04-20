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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

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