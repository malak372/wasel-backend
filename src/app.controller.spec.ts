import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * AppController Test Suite
 * ------------------------
 * Author:  All Team Members
 *
 * This file contains unit tests for the AppController.
 *
 * Purpose:
 * - Verify that the controller behaves as expected
 * - Ensure that routes return correct responses
 *
 * Tools Used:
 * - Jest (testing framework)
 * - NestJS Testing utilities (TestingModule)
 *
 * Test Strategy:
 * - Create an isolated testing module
 * - Inject controller and service
 * - Validate controller methods
 */
describe('AppController', () => {

  /**
   * Instance of AppController under test.
   */
  let appController: AppController;

  /**
   * beforeEach
   * ----------
   * Runs before each test case.
   *
   * Responsibilities:
   * - Create a fresh testing module
   * - Register controller and service
   * - Compile the module
   * - Retrieve the controller instance
   *
   * Purpose:
   * - Ensure each test runs in a clean and isolated environment
   */
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  /**
   * Root Endpoint Tests
   * -------------------
   * Tests related to the root route of the application.
   */
  describe('root', () => {

    /**
     * Test Case:
     * ----------
     * Verifies that the getHello() method returns the expected response.
     *
     * Expected Behavior:
     * - Should return the string "Hello World!"
     */
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

  });
});