import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'jwt_token';
  private userKey = 'user_data';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('AuthService - Constructor');
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserFromStorage();
    }
  }

  private loadUserFromStorage() {
    try {
      const token = localStorage.getItem(this.tokenKey);
      const savedUser = localStorage.getItem(this.userKey);

      console.log('AuthService - Token exists:', !!token);
      console.log('AuthService - User exists:', !!savedUser);

      if (token && savedUser) {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
        console.log('AuthService - User loaded:', user);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error loading user:', e);
      this.clearStorage();
      return false;
    }
  }

  refreshUser(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserFromStorage();
    }
  }

  private clearStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  login(username: string, password: string): Observable<any> {
    console.log('AuthService - Login attempt for:', username);
    return this.http.post(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap((response: any) => {
          console.log('AuthService - Login response:', response);
          if (response.token && isPlatformBrowser(this.platformId)) {
            const cleanToken = response.token.trim();
            localStorage.setItem(this.tokenKey, cleanToken);
            console.log('AuthService - Token saved');

            // Load user data from localStorage
            const savedUser = localStorage.getItem(this.userKey);
            console.log('AuthService - savedUser from localStorage:', savedUser);
            
            if (savedUser) {
              try {
                const user = JSON.parse(savedUser);
                user.role = response.role || 'USER';
                // Ensure address and phone are present
                console.log('AuthService - User address:', user.address);
                console.log('AuthService - User phone:', user.phoneNumber);
                this.currentUserSubject.next(user);
                console.log('AuthService - User loaded and set to subject:', user);
                return;
              } catch (e) {
                console.error('AuthService - Error parsing saved user:', e);
              }
            }

            // If no saved user data, create basic user
            const user: User = {
              username: response.username,
              role: response.role || 'USER',
              fullName: '',
              email: '',
              phoneNumber: '',
              address: ''
            };
            localStorage.setItem(this.userKey, JSON.stringify(user));
            this.currentUserSubject.next(user);
            console.log('AuthService - Basic user created');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('AuthService - Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(user: User): Observable<any> {
    console.log('AuthService - Register attempt:', user);
    return this.http.post(`${this.apiUrl}/auth/register`, user)
      .pipe(
        tap((response: any) => {
          console.log('AuthService - Registration response:', response);
          if (isPlatformBrowser(this.platformId)) {
            const userData: User = {
              username: user.username,
              email: user.email,
              fullName: user.fullName,
              phoneNumber: user.phoneNumber,
              address: user.address,
              role: 'USER'
            };
            localStorage.setItem(this.userKey, JSON.stringify(userData));
            console.log('AuthService - User data saved during registration:', userData);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('AuthService - Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    console.log('AuthService - User logged out');
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.tokenKey);
      console.log('AuthService - getToken called, exists:', !!token);
      return token;
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const result = !!token && token.length > 0;
    console.log('AuthService - isLoggedIn:', result);
    return result;
  }

  getCurrentUser(): User | null {
    const user = this.currentUserSubject.value;
    console.log('AuthService - getCurrentUser:', user);
    return user;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }
}