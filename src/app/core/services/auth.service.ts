/**
 * AuthService
 *
 * Handles all authentication flows: login, registration, token refresh,
 * and logout. Stores the JWT access/refresh token pair in localStorage
 * and exposes the current user as a reactive BehaviorSubject.
 *
 * Used by: authGuard, guestGuard, roleGuard, errorInterceptor,
 *          authTokenInterceptor, LoginComponent, SidebarComponent,
 *          TopUserBarComponent, ProfileComponent, SupportComponent.
 */
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

  /** Emits the current authenticated user, or null when logged out. */
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  /** Public observable of the current user for component subscriptions. */
  currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Serializes concurrent token refresh attempts.
   * true = a refresh is in progress; false = last refresh succeeded; null = idle.
   */
  private refreshing$ = new BehaviorSubject<boolean | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private subscriptionService: SubscriptionService
  ) {
    // Restore the user from localStorage so guards have a value on first load.
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        this.currentUserSubject.next(JSON.parse(stored));
      } catch {
        // Corrupted value — wipe storage to force a clean login.
        localStorage.clear();
      }
    }
  }

  /**
   * Attempts to log in with the provided credentials.
   * On success, stores the JWT pair in localStorage and updates currentUser$.
   *
   * @param credentials - Object containing `email` and `password`.
   * @returns Observable that emits the AuthResponse on success.
   */
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login/`, credentials)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  /**
   * Registers a new client account.
   * Does not auto-login; the user is redirected to /verify-email after success.
   *
   * @param data - Registration payload with full_name, email, company_name, and password.
   * @returns Observable emitting the server response.
   */
  register(data: {
    full_name: string;
    email: string;
    company_name: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, data);
  }

  /**
   * Fetches the current user from GET /auth/me/ and updates the in-memory cache.
   * Used by guards to validate an existing token after a page reload.
   *
   * @returns Observable<User> — the authenticated user profile.
   */
  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me/`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  /** Clears the session and navigates the user to the login page. */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /** Returns true if an access token exists in localStorage. Does not validate the token. */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  /** Returns the current user from the in-memory BehaviorSubject (synchronous). */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Resolves the current user's role name as a plain string.
   * Handles both the full Role object and the plain string variants returned by the API.
   *
   * @returns Role name (e.g. 'ADMIN', 'CLIENT') or an empty string if no user is loaded.
   */
  getRoleName(): string {
    const role = this.getCurrentUser()?.role;
    if (!role) return '';
    if (typeof role === 'string') return role;
    return (role as Role)?.name ?? '';
  }

  /** Returns true when the current user has the ADMIN role. */
  isAdmin(): boolean { return this.getRoleName() === 'ADMIN'; }
  /** Returns true when the current user has the CONSULTANT role. */
  isConsultant(): boolean { return this.getRoleName() === 'CONSULTANT'; }
  /** Returns true when the current user has the CLIENT role. */
  isClient(): boolean { return this.getRoleName() === 'CLIENT'; }

  /** Returns the stored JWT access token, or null if absent. */
  getAccessToken(): string | null { return localStorage.getItem('access_token'); }
  /** Returns the stored JWT refresh token, or null if absent. */
  getRefreshToken(): string | null { return localStorage.getItem('refresh_token'); }
  /** Alias for getAccessToken() used by legacy call sites. */
  getToken(): string | null { return this.getAccessToken(); }

  /**
   * Silently refreshes the access token using the stored refresh token.
   * Serializes concurrent refresh requests so only one HTTP call is made
   * even if multiple 401 responses arrive simultaneously.
   *
   * @returns Observable<string> — the new access token string.
   */
  refreshAccessToken(): Observable<string> {
    const refresh = this.getRefreshToken();
    if (!refresh) return throwError(() => new Error('no_refresh_token'));

    // A refresh is already in flight — wait for it to complete and reuse the result.
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

  /**
   * Removes all session data from localStorage and resets reactive state.
   * Also clears the subscription cache so stale plan data is not shown after logout.
   */
  clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.refreshing$.next(null);
    this.subscriptionService.clearCache();
  }

  /**
   * Persists tokens and user data after a successful login or registration.
   * Called internally by login(); not exposed publicly.
   */
  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access);
    if (res.refresh) {
      localStorage.setItem('refresh_token', res.refresh);
    }
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
    // Invalidate any cached subscription so the new session fetches fresh data.
    this.subscriptionService.clearCache();
  }
}
