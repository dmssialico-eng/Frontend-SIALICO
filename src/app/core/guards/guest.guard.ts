/**
 * guestGuard
 *
 * Prevents already-authenticated users from accessing public-only routes
 * such as /login, /register, and /verify-email.
 *
 * If the user is authenticated, they are redirected to their role-specific
 * dashboard: ADMIN → /admin/dashboard, everyone else → /dashboard.
 * If the token is present but the user is not yet loaded, a server call
 * is made to resolve the role before redirecting.
 *
 * Applied to: /login, /register, /verify-email.
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // No token — allow access to the public route.
  if (!authService.isAuthenticated()) {
    return true;
  }

  // User already resolved in memory — redirect without an HTTP call.
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    const roleName = authService.getRoleName();
    return router.parseUrl(roleName === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
  }

  // Token present but user not yet loaded (e.g. page reload on a public route).
  return authService.me().pipe(
    map(() => {
      const roleName = authService.getRoleName();
      return router.parseUrl(roleName === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    }),
    catchError(() => {
      // Token is invalid — clear it and let the user access the public route.
      authService.clearSession();
      return of(true);
    })
  );
};