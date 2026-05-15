import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();

  const expectedRole = route.data?.['expectedRole'];

  if (authService.isAuthenticated() && user && user.role === expectedRole) {
    return true;
  }

  return router.parseUrl('/dashboard');
};
