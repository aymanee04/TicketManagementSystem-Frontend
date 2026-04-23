import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { User } from '../models/user.model';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  'access-token': string;
  'refresh-token': string;
}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private backendHost = 'http://localhost:8080';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    let storedUser: User | null = null;

    if (this.isBrowser) {
      const userJson = localStorage.getItem('currentUser');
      storedUser = userJson ? JSON.parse(userJson) : null;
    }

    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }


  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.backendHost}/auth/login`, { email, password })
      .pipe(
        tap(response => {

          if (this.isBrowser && response['access-token']) {
            localStorage.setItem('access-token', response['access-token']);
            localStorage.setItem('refresh-token', response['refresh-token']);

            const user = this.decodeToken(response['access-token']);
            if (user) {
              localStorage.setItem('currentUser', JSON.stringify(user));
              this.currentUserSubject.next(user);
            }
          }
        }),
        catchError(error => {
          console.error('Login error in service:', error);
          this.clearAuth();
          return throwError(() => error);
        })
      );
  }

  clearAuth(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.isBrowser ? localStorage.getItem('refresh-token') : null;
    return this.http.get<LoginResponse>(`${this.backendHost}/auth/refreshToken`, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    }).pipe(
      tap(response => {
        if (this.isBrowser) {
          localStorage.setItem('access-token', response['access-token']);
          localStorage.setItem('refresh-token', response['refresh-token']);
        }
      })
    );
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;

    const token = localStorage.getItem('access-token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() < expiry;
    } catch {
      return false;
    }
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user ? user.roles.includes(role as any) : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return roles.some(role => user.roles.includes(role as any));
  }

  private decodeToken(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      return {
        userId: payload.userId || payload.sub,
        name: payload.name || payload.username,
        email: payload.email,
        roles: payload.roles || payload.authorities || [],
        clientId: payload.clientId,
        clientName: payload.clientName,
        jobTitle: payload.jobTitle
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('access-token') : null;
  }

  getRefreshToken(): string | null {
    return this.isBrowser ? localStorage.getItem('refresh-token') : null;
  }
}
