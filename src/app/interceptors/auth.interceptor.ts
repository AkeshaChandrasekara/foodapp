import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    if (request.url.includes('/auth/login') || request.url.includes('/auth/register')) {
      console.log('AuthInterceptor - Skipping token for auth request');
      return next.handle(request);
    }

    
    let token = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('jwt_token');
      console.log('AuthInterceptor - Raw token from localStorage:', token ? 'exists' : 'null');
    }

    if (token) {
      
      token = token.replace(/['"]+/g, '').trim();

      if (token.length > 0) {
        request = request.clone({
          setHeaders: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('AuthInterceptor - Added Authorization header');
      } else {
        console.warn('AuthInterceptor - Token is empty after cleaning');
      }
    } else {
      console.warn('AuthInterceptor - No token found');
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('AuthInterceptor - Error:', error.status, error.statusText);

       
        if (!request.url.includes('/auth/login') && !request.url.includes('/auth/register')) {
          if (error.status === 401 || error.status === 403) {
            console.error('AuthInterceptor - Authentication failed');
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.removeItem('jwt_token');
              localStorage.removeItem('user_data');
            }
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }
}
