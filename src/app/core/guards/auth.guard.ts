/**
 * authGuard
 *
 * Protects all routes that require an authenticated user.
 * Validates authentication by consulting the server (/auth/me/) rather
 * than trusting localStorage alone — this prevents bypass via a manipulated
 * or expired token stored locally.
 *
 * Applied to: all routes under DashboardLayout and AdminLayout,
 *             and the standalone /onboarding route.
 *
 * Redirect: unauthenticated users are sent to /login.
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // No token in storage — redirect immediately without an HTTP call.
  if (!authService.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  // User is already loaded in memory (normal in-session navigation).
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    return true;
  }

  /* Token present but no in-memory user (e.g. page reload).
     Validate the token server-side before allowing access. */
  return authService.me().pipe(
    map(() => true),
    catchError(() => {
      authService.clearSession();
      return of(router.parseUrl('/login'));
    })
  );
};