import { Test, TestingModule } from '@nestjs/testing';
import { AlertSubscriptionsController } from './alert-subscriptions.controller';
import { AlertSubscriptionsService } from './alert-subscriptions.service';

/**
 * @file alert-subscriptions.controller.spec.ts
 * @description Unit tests for the AlertSubscriptionsController.
 * This suite ensures that the controller is properly instantiated and 
 * its dependencies are correctly injected within the NestJS testing context.
 */

describe('AlertSubscriptionsController', () => {
  let controller: AlertSubscriptionsController;

  /**
   * Setup phase: Creates a testing module that mimics the host module.
   * This runs before every individual test case.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertSubscriptionsController],
      providers: [AlertSubscriptionsService],
    }).compile();

    /** Fetch the controller instance from the compiled module */
    controller = module.get<AlertSubscriptionsController>(AlertSubscriptionsController);
  });

  /**
   * Smoke test to verify the controller's existence.
   * @test
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});