import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const roleGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole: string = route.data?.['expectedRole'] ?? '';

  const checkRole = (roleName: string): boolean => {
    return roleName === expectedRole;
  };

  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    return checkRole(authService.getRoleName())
      ? true
      : router.parseUrl('/dashboard');
  }

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