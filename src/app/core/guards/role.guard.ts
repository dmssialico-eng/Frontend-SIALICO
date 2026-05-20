import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const expectedRole: string = route.data?.['expectedRole'] ?? '';
  const roleName = authService.getRoleName();

  if (authService.isAuthenticated() && roleName === expectedRole) {
    return true;
  }

  return router.parseUrl('/dashboard');
};
