/**
 * errorInterceptor
 *
 * Globally handles 401 Unauthorized responses by attempting a silent
 * token refresh. If the refresh succeeds, the original failed request is
 * retried with the new access token transparently.
 *
 * If the 401 came from an auth endpoint (login, refresh, register), it is
 * not retried — the session is cleared and the user is redirected to /login
 * to avoid an infinite refresh loop.
 *
 * If the refresh itself fails, the session is cleared and the user is
 * sent to /login.
 *
 * Registered in app.config.ts via withInterceptors([..., errorInterceptor]).
 * AuthService.refreshAccessToken() serializes concurrent refresh calls
 * so only one network request is made even when multiple 401s arrive at once.
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Auth endpoints that must never trigger a token refresh attempt. */
const AUTH_ROUTES = ['/auth/login/', '/auth/refresh/', '/auth/register/'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 Unauthorized; pass all other errors through.
      if (error.status !== 401) return throwError(() => error);

      // Auth route 401 (e.g. bad credentials) — clear session and go to login.
      const isAuthRoute = AUTH_ROUTES.some(route => req.url.includes(route));
      if (isAuthRoute) {
        authService.clearSession();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      // Non-auth 401 — attempt a silent token refresh and retry the request.
      return authService.refreshAccessToken().pipe(
        switchMap(newToken => {
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(retried);
        }),
        catchError(refreshErr => {
          // Refresh failed (e.g. refresh token expired) — force re-login.
          authService.clearSession();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        })
      );
    })
  );
};