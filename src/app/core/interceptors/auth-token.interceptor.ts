/**
 * authTokenInterceptor
 *
 * Attaches the JWT access token to every outgoing HTTP request as a
 * Bearer token in the Authorization header.
 *
 * Skips token injection when no token is present (unauthenticated requests
 * such as login and register are forwarded as-is).
 *
 * Registered in app.config.ts via withInterceptors([authTokenInterceptor, ...]).
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  if (token) {
    // Clone the request to add the Authorization header; HttpRequest is immutable.
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
