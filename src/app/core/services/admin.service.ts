import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminDashboardStats, AdminUser, Ticket } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.apiUrl}/admin/stats/`);
  }

  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/users/`);
  }

  getUserDetail(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/admin/users/${id}/`);
  }

  updateUserStatus(id: number, isActive: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/admin/users/${id}/`, {
      is_active: isActive
    });
  }

  getAllTickets(status?: string): Observable<any> {
    const url = status
      ? `${this.apiUrl}/tickets/?status=${status}`
      : `${this.apiUrl}/tickets/`;
    return this.http.get<any>(url);
  }

  updateTicketStatus(id: number, status: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/tickets/${id}/`, { status });
  }

  getPendingPurchases(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/purchases/?status=pending`);
  }

  approvePurchase(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/purchases/${id}/approve/`, {});
  }

  rejectPurchase(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/purchases/${id}/reject/`, {});
  }
}