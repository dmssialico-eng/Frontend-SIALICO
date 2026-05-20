import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) return throwError(() => error);

      // Don't try to refresh if the failing request was the refresh itself
      if (req.url.includes('/auth/refresh/')) {
        authService.clearSession();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap(newToken => {
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(retried);
        }),
        catchError(refreshErr => {
          authService.clearSession();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
