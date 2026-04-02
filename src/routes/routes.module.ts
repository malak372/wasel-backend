import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [RoutesController],
  providers: [RoutesService],
})
export class RoutesModule {}