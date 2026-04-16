import { Test, TestingModule } from '@nestjs/testing';
import { AlertSubscriptionsService } from './alert-subscriptions.service';

describe('AlertSubscriptionsService', () => {
  let service: AlertSubscriptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertSubscriptionsService],
    }).compile();

    service = module.get<AlertSubscriptionsService>(AlertSubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
