import { Test, TestingModule } from '@nestjs/testing';
import { AlertSubscriptionsService } from './alert-subscriptions.service';

/**
 * @file alert-subscriptions.service.spec.ts
 * @description Unit tests for the AlertSubscriptionsService.
 * This suite verifies the successful instantiation of the service and 
 * prepares the testing environment for business logic validation.
 */

describe('AlertSubscriptionsService', () => {
  let service: AlertSubscriptionsService;

  /**
   * Setup phase: Initializes the NestJS testing utility.
   * Compiles a mock module that provides the AlertSubscriptionsService.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertSubscriptionsService],
    }).compile();

    /** Retrieve the service instance from the testing container */
    service = module.get<AlertSubscriptionsService>(AlertSubscriptionsService);
  });

  /**
   * Smoke test to confirm the service is correctly defined and injected.
   * @test
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});