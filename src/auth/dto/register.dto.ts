import { IsEmail, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';

export enum RegisterRole {
  citizen = 'citizen',
  moderator = 'moderator',
  admin = 'admin',
}

export class RegisterDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(RegisterRole)
  role?: RegisterRole;
}