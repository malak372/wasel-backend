import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // هذا هو الاسم الصحيح للخاصية في Prisma 7
      datasourceUrl: process.env.DATABASE_URL,
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('🚀 Successfully connected to the database!');
    } catch (error) {
      this.logger.error('❌ Connection failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}