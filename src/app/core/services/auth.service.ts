import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, credentials).pipe(
      tap(response => this.saveSession(response))
    );
  }

  register(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, payload);
  }

  logout() {
    this.clearSession();
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me/`).pipe(
      tap(user => {
        localStorage.setItem('sialico_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    return localStorage.getItem('sialico_access_token');
  }
  
  getRefreshToken(): string | null {
    return localStorage.getItem('sialico_refresh_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem('sialico_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  private saveSession(response: AuthResponse) {
    localStorage.setItem('sialico_access_token', response.access);
    localStorage.setItem('sialico_refresh_token', response.refresh);
    if (response.user) {
      localStorage.setItem('sialico_user', JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }
  }

  public clearSession() {
    localStorage.removeItem('sialico_access_token');
    localStorage.removeItem('sialico_refresh_token');
    localStorage.removeItem('sialico_user');
    this.currentUserSubject.next(null);
  }
}
