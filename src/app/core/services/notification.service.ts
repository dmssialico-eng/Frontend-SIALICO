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

  getNotifications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/`);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/?is_read=false`).pipe(
      map(res => {
        if (typeof res?.count === 'number') return res.count;
        const list: Notification[] = res?.results ?? res ?? [];
        return list.filter(n => !n.is_read).length;
      }),
      catchError(() => of(0))
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/mark-read/`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-all-read/`, {});
  }
}
