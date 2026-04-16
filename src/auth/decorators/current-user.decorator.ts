import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser Decorator
 * ---------------------
 * Author: Malak
 *
 * Custom parameter decorator used to extract the authenticated user
 * object from the incoming HTTP request.
 *
 * This decorator provides a clean way to access `request.user`
 * inside controller methods without using @Req().
 */
export const CurrentUser = createParamDecorator(

  /**
   * Decorator Factory Function
   * --------------------------
   * @param _data - Optional parameter (not used here)
   * @param ctx - Execution context of the current request
   *
   * How it works:
   * - Receives the execution context from NestJS
   * - Extracts the HTTP request object
   * - Returns the user attached to the request
   */
  (_data: unknown, ctx: ExecutionContext) => {

    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);