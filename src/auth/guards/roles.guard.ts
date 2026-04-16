import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard
 * ----------
 * Author: Malak
 *
 * A custom authorization guard that implements Role-Based Access Control (RBAC)
 * in a NestJS application.
 *
 * This guard determines whether a request is allowed to proceed
 * based on the roles assigned to the current user and the roles
 * required by the route handler.
 *
 * It works in conjunction with the Roles decorator and Reflector
 * to retrieve and evaluate metadata attached to routes.
 *
 * Dependencies:
 * - Reflector: Used to access metadata defined by decorators.
 * - ROLES_KEY: Metadata key under which roles are stored.
 *
 * Behavior:
 * - Retrieves required roles from route metadata.
 * - If no roles are defined, access is granted by default.
 * - Extracts the authenticated user from the request.
 * - Compares the user's role with the required roles.
 * - Grants or denies access accordingly.
 */
@Injectable()
export class RolesGuard implements CanActivate {

  /**
   * Constructor
   * -----------
   * Initializes the RolesGuard with an instance of Reflector.
   *
   * Reflector is used to read metadata assigned by the Roles decorator
   * at both the handler and class levels.
   *
   * @param reflector - Instance of NestJS Reflector for metadata retrieval
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * canActivate
   * -----------
   * Determines whether the current request is authorized to access the route.
   *
   * @param context - ExecutionContext representing the current request lifecycle
   * @returns boolean - true if access is allowed, false otherwise
   *
   * Process:
   * 1. Retrieves required roles from metadata using Reflector.
   * 2. If no roles are defined, allows access.
   * 3. Extracts the HTTP request object.
   * 4. Retrieves the authenticated user from request.user.
   * 5. If no user exists, denies access.
   * 6. Checks if the user's role matches any of the required roles.
   */
  canActivate(context: ExecutionContext): boolean {

    /**
     * requiredRoles
     * -------------
     * Retrieves roles metadata from both:
     * - Route handler
     * - Controller class
     *
     * getAllAndOverride ensures that method-level roles
     * override class-level roles if both are defined.
     */
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    /**
     * If no roles are defined for the route,
     * access is granted by default.
     */
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    /**
     * Extract the HTTP request object from the execution context.
     */
    const request = context.switchToHttp().getRequest();

    /**
     * Retrieve the authenticated user from the request.
     * This is typically set by an authentication guard (e.g., JWT Guard).
     */
    const user = request.user;

    /**
     * If no user is found, deny access.
     */
    if (!user) return false;

    /**
     * Check if the user's role is included in the required roles.
     * If yes, grant access; otherwise, deny.
     */
    return requiredRoles.includes(user.role);
  }
}