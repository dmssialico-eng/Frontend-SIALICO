import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  updateProfile(payload: any): Observable<User> {
    // Assuming backend handles this under /auth/me/ or similar, depending on backend implementation.
    // For now we will use /auth/me/ PUT if possible, otherwise it depends on the exact endpoint.
    return this.http.put<User>(`${environment.apiUrl}/auth/me/`, payload);
  }
}
