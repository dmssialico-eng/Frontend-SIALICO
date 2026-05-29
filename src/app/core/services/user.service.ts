/**
 * UserService
 *
 * Handles profile update operations for the currently authenticated user.
 * Endpoint: PUT /api/auth/me/
 *
 * Admin-side user management (listing users, toggling active status) lives in
 * AdminService, which owns the /api/users/ endpoint.
 *
 * Used by: ProfileComponent, OnboardingComponent.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  /**
   * Updates the current user's profile fields via PUT /api/auth/me/.
   * After a successful save, callers should refresh the in-memory user
   * by calling AuthService.me() to keep the BehaviorSubject up to date.
   *
   * @param payload - Partial user fields to update (e.g. full_name, company_name, phone).
   * @returns Observable<User> — the updated user record.
   */
  updateProfile(payload: any): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/auth/me/`, payload);
  }
}
