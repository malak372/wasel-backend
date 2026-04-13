import { Test, TestingModule } from '@nestjs/testing';
import { AlertSubscriptionsController } from './alert-subscriptions.controller';
import { AlertSubscriptionsService } from './alert-subscriptions.service';

describe('AlertSubscriptionsController', () => {
  let controller: AlertSubscriptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertSubscriptionsController],
      providers: [AlertSubscriptionsService],
    }).compile();

    controller = module.get<AlertSubscriptionsController>(AlertSubscriptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
