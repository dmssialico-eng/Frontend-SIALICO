/**
 * roleGuard
 *
 * Restricts access to routes that require a specific user role.
 * The expected role is declared on the route's `data.expectedRole` property.
 *
 * If the user's role does not match, they are redirected to /dashboard.
 * If the session is invalid, they are cleared and sent to /login.
 *
 * Applied to: the /admin route group (expectedRole: 'ADMIN').
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const roleGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  /** Role name that the route requires, e.g. 'ADMIN'. */
  const expectedRole: string = route.data?.['expectedRole'] ?? '';

  const checkRole = (roleName: string): boolean => {
    return roleName === expectedRole;
  };

  // User already in memory — check role synchronously.
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    return checkRole(authService.getRoleName())
      ? true
      : router.parseUrl('/dashboard');
  }

  // User not yet loaded — resolve via server before checking role.
  return authService.me().pipe(
    map(() => {
      return checkRole(authService.getRoleName())
        ? true
        : router.parseUrl('/dashboard');
    }),
    catchError(() => {
      authService.clearSession();
      return of(router.parseUrl('/login'));
    })
  );
};