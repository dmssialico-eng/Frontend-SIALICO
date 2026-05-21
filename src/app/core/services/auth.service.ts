import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, switchMap, catchError, filter, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, Role } from '../models/models';
import { SubscriptionService } from './subscription.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private refreshing$ = new BehaviorSubject<boolean | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private subscriptionService: SubscriptionService
  ) {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        this.currentUserSubject.next(JSON.parse(stored));
      } catch {
        localStorage.clear();
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login/`, credentials)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  register(data: {
    full_name: string;
    email: string;
    company_name: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, data);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me/`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getRoleName(): string {
    const role = this.getCurrentUser()?.role;
    if (!role) return '';
    if (typeof role === 'string') return role;
    return (role as Role)?.name ?? '';
  }

  isAdmin(): boolean { return this.getRoleName() === 'ADMIN'; }
  isConsultant(): boolean { return this.getRoleName() === 'CONSULTANT'; }
  isClient(): boolean { return this.getRoleName() === 'CLIENT'; }

  getAccessToken(): string | null { return localStorage.getItem('access_token'); }
  getRefreshToken(): string | null { return localStorage.getItem('refresh_token'); }
  getToken(): string | null { return this.getAccessToken(); }

  refreshAccessToken(): Observable<string> {
    const refresh = this.getRefreshToken();
    if (!refresh) return throwError(() => new Error('no_refresh_token'));

    if (this.refreshing$.value === true) {
      return this.refreshing$.pipe(
        filter(v => v !== true),
        take(1),
        switchMap(success =>
          success
            ? new Observable<string>(obs => { obs.next(this.getAccessToken()!); obs.complete(); })
            : throwError(() => new Error('refresh_failed'))
        )
      );
    }

    this.refreshing$.next(true);
    return this.http.post<{ access: string }>(`${this.apiUrl}/refresh/`, { refresh }).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.access);
        this.refreshing$.next(false);
      }),
      switchMap(res => new Observable<string>(obs => { obs.next(res.access); obs.complete(); })),
      catchError(err => {
        this.refreshing$.next(false);
        return throwError(() => err);
      })
    );
  }

  clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.refreshing$.next(null);
    this.subscriptionService.clearCache();
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access);
    if (res.refresh) {
      localStorage.setItem('refresh_token', res.refresh);
    }
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
    this.subscriptionService.clearCache();
  }
}
