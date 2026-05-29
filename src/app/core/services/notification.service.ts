/**
 * NotificationService
 *
 * Manages user notifications: fetching the list, tracking unread count,
 * and marking notifications as read individually or in bulk.
 *
 * Endpoints: /api/notifications/
 *
 * Used by: SidebarComponent (unread count polling),
 *          NotificationsComponent (full list with infinite scroll),
 *          DashboardService (recent notifications preview).
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  /**
   * Returns the full notifications list (paginated or plain array).
   *
   * @returns Observable of the raw server response.
   */
  getNotifications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/`);
  }

  /**
   * Returns the current unread notification count.
   * Prefers the paginated `count` field; falls back to client-side counting.
   * Returns 0 on error so the badge does not break on transient failures.
   *
   * @returns Observable<number> — number of unread notifications.
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/?is_read=false`).pipe(
      map(res => {
        // Use the server-provided count when available (more accurate for large datasets).
        if (typeof res?.count === 'number') return res.count;
        const list: Notification[] = res?.results ?? res ?? [];
        return list.filter(n => !n.is_read).length;
      }),
      catchError(() => of(0))
    );
  }

  /**
   * Marks a single notification as read via POST /api/notifications/{id}/mark-read/.
   *
   * @param id - Notification primary key.
   * @returns Observable of the server response.
   */
  markAsRead(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/mark-read/`, {});
  }

  /**
   * Marks all of the current user's notifications as read
   * via POST /api/notifications/mark-all-read/.
   *
   * @returns Observable of the server response.
   */
  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-all-read/`, {});
  }
}
