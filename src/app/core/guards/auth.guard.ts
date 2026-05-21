import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

/**
 * Verifica autenticación real consultando al servidor (/auth/me/).
 * Esto previene el bypass vía localStorage manipulado: si el token
 * es inválido, el servidor devolverá 401 y se redirige a login.
 * En rutas donde ya tenemos el usuario cargado en memoria (BehaviorSubject),
 * usamos el caché para evitar una petición extra en cada navegación.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no hay token en storage, redirige inmediatamente sin llamada HTTP
  if (!authService.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  // Si ya tenemos el usuario cargado en memoria, confiar en él
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    return true;
  }

  // Token presente pero sin usuario en memoria (ej. recarga de página):
  // validar el token contra el servidor
  return authService.me().pipe(
    map(() => true),
    catchError(() => {
      authService.clearSession();
      return of(router.parseUrl('/login'));
    })
  );
};