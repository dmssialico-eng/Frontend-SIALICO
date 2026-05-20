import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminDashboardStats, AdminUser, Payment, Ticket } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────

  getDashboardStats(): Observable<AdminDashboardStats> {
    return forkJoin({
      labels:   this.http.get<any>(`${this.apiUrl}/labels/?status=SUBMITTED`).pipe(catchError(() => of({ count: 0, results: [] }))),
      tickets:  this.http.get<any>(`${this.apiUrl}/tickets/?status=OPEN`).pipe(catchError(() => of({ count: 0, results: [] }))),
      users:    this.http.get<any>(`${this.apiUrl}/users/`).pipe(catchError(() => of({ count: 0, results: [] }))),
      payments: this.http.get<any>(`${this.apiUrl}/payments/?status=PENDING`).pipe(catchError(() => of({ count: 0, results: [] }))),
    }).pipe(
      map(data => {
        const totalUsers    = data.users.count   ?? data.users.results?.length   ?? 0;
        const allUsers: AdminUser[] = data.users.results ?? data.users ?? [];
        const activeUsers   = allUsers.filter((u: AdminUser) => u.is_active).length;

        return {
          pending_labels:            data.labels.count   ?? data.labels.results?.length   ?? 0,
          open_tickets:              data.tickets.count  ?? data.tickets.results?.length  ?? 0,
          total_users:               totalUsers,
          active_users:              activeUsers,
          pending_purchases:         data.payments.count ?? data.payments.results?.length ?? 0,
          labels_reviewed_this_month: 0,
        } as AdminDashboardStats;
      })
    );
  }

  // ── Usuarios ──────────────────────────────────────────────────────────────

  getAllUsers(params?: { role?: string; is_active?: boolean }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.role)      httpParams = httpParams.set('role', params.role);
    if (params?.is_active !== undefined) httpParams = httpParams.set('is_active', String(params.is_active));
    return this.http.get<any>(`${this.apiUrl}/users/`, { params: httpParams });
  }

  getUserDetail(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/users/${id}/`);
  }

  updateUserStatus(id: number, isActive: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/users/${id}/`, { is_active: isActive });
  }

  // ── Tickets ───────────────────────────────────────────────────────────────

  getAllTickets(status?: string): Observable<any> {
    const params = status
      ? new HttpParams().set('status', status.toUpperCase())
      : new HttpParams();
    return this.http.get<any>(`${this.apiUrl}/tickets/`, { params });
  }

  /** PATCH /api/tickets/{id}/update_status/ */
  updateTicketStatus(id: number, status: string): Observable<Ticket> {
    return this.http.patch<Ticket>(
      `${this.apiUrl}/tickets/${id}/update_status/`,
      { status: status.toUpperCase() }
    );
  }

  // ── Pagos ─────────────────────────────────────────────────────────────────

  getAllPayments(status?: string): Observable<any> {
    const params = status
      ? new HttpParams().set('status', status.toUpperCase())
      : new HttpParams();
    return this.http.get<any>(`${this.apiUrl}/payments/`, { params });
  }

  confirmPayment(id: number): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments/${id}/confirm/`, {});
  }

  rejectPayment(id: number): Observable<Payment> {
    return this.http.patch<Payment>(`${this.apiUrl}/payments/${id}/`, { status: 'REJECTED' });
  }
}
