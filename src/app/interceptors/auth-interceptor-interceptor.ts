import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const skipUrls = ['/auth/login', '/auth/refreshToken'];
  const shouldSkip = skipUrls.some(url => req.url.includes(url));

  if (!shouldSkip) {
    const token = authService.getToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        console.log('Unauthorized request - redirecting to login');
        authService.logout();
      } else if (error.status === 403) {
        console.log('Forbidden - user lacks permission');
      }

      return throwError(() => error);
    })
  );
};
