import { Test, TestingModule } from '@nestjs/testing';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

/**
 * @file alerts.controller.spec.ts
 * @description Unit tests for the AlertsController.
 * This suite ensures that the controller is correctly instantiated within 
 * the NestJS testing container and that all dependencies are properly resolved.
 */

describe('AlertsController', () => {
  let controller: AlertsController;

  /**
   * Setup phase: Initializes the testing module before each test case.
   * Compiles the controller and its associated service into a virtual module.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [AlertsService],
    }).compile();

    /** Assign the controller instance from the compiled module to the local variable */
    controller = module.get<AlertsController>(AlertsController);
  });

  /**
   * Smoke test to verify that the controller instance is successfully created.
   * @test
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});