import { SetMetadata } from '@nestjs/common'; 

/**
 * Roles Decorator
 * ----------------
 * Author: Malak
 *
 * Custom decorator used to implement Role-Based Access Control (RBAC)
 * in NestJS applications.
 *
 * This decorator assigns required roles to a route handler,
 * which can later be checked by an authorization guard (e.g., RolesGuard).
 */

/**
 * ROLES_KEY
 * ---------
 * - A constant key used to store roles metadata.
 * - This key is used by both the decorator and the guard to read/write roles.
 */
export const ROLES_KEY = 'roles';


/**
 * Roles Decorator Function
 * ------------------------
 * - Accepts a variable number of roles (rest parameter).
 * - Attaches these roles as metadata to the route handler.
 *
 * @param roles - List of roles allowed to access the route
 *
 * How it works:
 * - Uses SetMetadata to bind roles to the handler using ROLES_KEY.
 * - A guard (e.g., RolesGuard) retrieves this metadata via Reflector.
 * - The guard compares user role with allowed roles.
 */
export const Roles = (...roles: string[]) => 
  SetMetadata(ROLES_KEY, roles); 