import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../models/models';

// ─────────────────────────────────────────────────────────────
// MODO DESARROLLO — sin backend
// Cambia DEV_MODE a false cuando el backend esté listo.
// ─────────────────────────────────────────────────────────────
const DEV_MODE = true;

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'usuario@empresa.com': {
    password: 'user123',
    user: {
      id: 2,
      email: 'usuario@empresa.com',
      full_name: 'María López',
      role: 'user',
      company_name: 'Lácteos del Norte',
      phone: '+52 222 000 0002',
      is_active: true,
    },
  },
  'admin@sialico.com': {
    password: 'admin123',
    user: {
      id: 1,
      email: 'admin@sialico.com',
      full_name: 'Admin Sialico',
      role: 'admin',
      company_name: 'Sialico Food Safety',
      phone: '+52 222 000 0001',
      is_active: true,
    },
  },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        this.currentUserSubject.next(JSON.parse(stored));
      } catch {
        localStorage.clear();
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    if (DEV_MODE) {
      return this.mockLogin(credentials);
    }
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, credentials).pipe(
      tap((res) => this.handleAuthSuccess(res))
    );
  }

  private mockLogin(credentials: { email: string; password: string }): Observable<any> {
    const entry = MOCK_USERS[credentials.email.toLowerCase()];
    if (!entry || entry.password !== credentials.password) {
      return new Observable(observer => {
        observer.error({ status: 401, message: 'Credenciales invalidas' });
      });
    }
    const fakeToken = 'dev-token-' + Date.now();
    localStorage.setItem('access_token', fakeToken);
    localStorage.setItem('user', JSON.stringify(entry.user));
    this.currentUserSubject.next(entry.user);
    return of({ user: entry.user, access: fakeToken });
  }

  register(data: any): Observable<any> {
    if (DEV_MODE) {
      return of({ message: 'Registro simulado en modo dev' });
    }
    return this.http.post(`${this.apiUrl}/register/`, data);
  }

  me(): Observable<User> {
    if (DEV_MODE) {
      return of(this.getCurrentUser() as User);
    }
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

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  // Requerido por auth-token.interceptor.ts
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Alias por si se usa en otros lugares
  getToken(): string | null {
    return this.getAccessToken();
  }

  // Requerido por error.interceptor.ts
  clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }
}