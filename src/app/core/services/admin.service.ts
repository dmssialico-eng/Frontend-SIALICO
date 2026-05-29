/**
 * AdminService
 *
 * Wraps all admin-facing API endpoints: dashboard stats aggregation,
 * user management, ticket management, and payment processing.
 *
 * API base: /api/
 * Endpoints used: /labels/, /tickets/, /users/, /payments/
 *
 * Used by: AdminDashboardComponent, AdminUsersComponent,
 *          AdminTicketsComponent, AdminTicketDetailComponent,
 *          AdminPaymentsComponent.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminDashboardStats, AdminUser, Payment, Ticket } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Dashboard ────────────────────────────────────────────────────────────

  /**
   * Assembles the admin dashboard KPI counters in a single parallel request.
   * Each source request is protected with catchError so one failure does not
   * block the whole dashboard.
   *
   * @returns Observable<AdminDashboardStats> — aggregated platform counters.
   */
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
        // Active users are counted client-side since the API does not provide a pre-aggregated value.
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

  // ── Users ────────────────────────────────────────────────────────────────

  /**
   * Returns a paginated list of all users, with optional filters.
   *
   * @param params.role - Filter by role name (e.g. 'CLIENT').
   * @param params.is_active - Filter by account active status.
   * @returns Observable of the raw paginated response.
   */
  getAllUsers(params?: { role?: string; is_active?: boolean }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.role)      httpParams = httpParams.set('role', params.role);
    if (params?.is_active !== undefined) httpParams = httpParams.set('is_active', String(params.is_active));
    return this.http.get<any>(`${this.apiUrl}/users/`, { params: httpParams });
  }

  /**
   * Fetches a single user with full detail including subscription.
   *
   * @param id - User primary key.
   * @returns Observable<AdminUser>.
   */
  getUserDetail(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/users/${id}/`);
  }

  /**
   * Activates or deactivates a user account via PATCH /api/users/{id}/.
   *
   * @param id - User primary key.
   * @param isActive - New active status to set.
   * @returns Observable<AdminUser> — the updated user record.
   */
  updateUserStatus(id: number, isActive: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/users/${id}/`, { is_active: isActive });
  }

  // ── Tickets ──────────────────────────────────────────────────────────────

  /**
   * Returns all support tickets, optionally filtered by status.
   *
   * @param status - Optional ticket status string (e.g. 'OPEN').
   * @returns Observable of the raw paginated response.
   */
  getAllTickets(status?: string): Observable<any> {
    const params = status
      ? new HttpParams().set('status', status.toUpperCase())
      : new HttpParams();
    return this.http.get<any>(`${this.apiUrl}/tickets/`, { params });
  }

  /**
   * Updates the status of a support ticket via PATCH /api/tickets/{id}/update_status/.
   *
   * @param id - Ticket primary key.
   * @param status - New status value (e.g. 'ANSWERED', 'CLOSED').
   * @returns Observable<Ticket> — the updated ticket.
   */
  updateTicketStatus(id: number, status: string): Observable<Ticket> {
    return this.http.patch<Ticket>(
      `${this.apiUrl}/tickets/${id}/update_status/`,
      { status: status.toUpperCase() }
    );
  }

  // ── Payments ─────────────────────────────────────────────────────────────

  /**
   * Returns all payment records, optionally filtered by status.
   *
   * @param status - Optional status filter (e.g. 'PENDING', 'CONFIRMED').
   * @returns Observable of the raw paginated response.
   */
  getAllPayments(status?: string): Observable<any> {
    const params = status
      ? new HttpParams().set('status', status.toUpperCase())
      : new HttpParams();
    return this.http.get<any>(`${this.apiUrl}/payments/`, { params });
  }

  /**
   * Confirms a pending payment via POST /api/payments/{id}/confirm/.
   *
   * @param id - Payment primary key.
   * @returns Observable<Payment> — the updated payment record.
   */
  confirmPayment(id: number): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments/${id}/confirm/`, {});
  }

  /**
   * Rejects a pending payment via PATCH /api/payments/{id}/.
   *
   * @param id - Payment primary key.
   * @returns Observable<Payment> — the updated payment record.
   */
  rejectPayment(id: number): Observable<Payment> {
    return this.http.patch<Payment>(`${this.apiUrl}/payments/${id}/`, { status: 'REJECTED' });
  }
}
