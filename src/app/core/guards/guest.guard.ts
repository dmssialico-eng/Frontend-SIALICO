import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';


export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    const roleName = authService.getRoleName();
    return router.parseUrl(roleName === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
  }

  return authService.me().pipe(
    map(() => {
      const roleName = authService.getRoleName();
      return router.parseUrl(roleName === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    }),
    catchError(() => {
      authService.clearSession();
      return of(true);
    })
  );
};