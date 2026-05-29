/**
 * AuditService
 *
 * Wraps the GET /api/audit-logs/ endpoint to fetch platform audit records.
 * Supports filtering by entity type and actor email, and server-side pagination.
 *
 * Used by: AdminAuditComponent.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuditLog } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private apiUrl = `${environment.apiUrl}/audit-logs`;

  constructor(private http: HttpClient) {}

  /**
   * Fetches a paginated list of audit log entries.
   *
   * @param params.entity - Filter by entity_name (e.g. 'LabelVersion').
   * @param params.actor  - Filter by actor_email (partial match supported by backend).
   * @param params.page   - 1-based page number for server-side pagination.
   * @returns Observable emitting results array and total count.
   */
  getLogs(params?: { entity?: string; actor?: string; page?: number }): Observable<{ results: AuditLog[]; count: number }> {
    let httpParams = new HttpParams();
    if (params?.entity) httpParams = httpParams.set('entity_name', params.entity);
    if (params?.actor)  httpParams = httpParams.set('actor_email', params.actor);
    if (params?.page)   httpParams = httpParams.set('page', String(params.page));

    return this.http.get<any>(`${this.apiUrl}/`, { params: httpParams }).pipe(
      // Normalize both paginated and non-paginated response shapes.
      map(res => ({
        results: res.results ?? res,
        count:   res.count   ?? (res.results ?? res).length,
      }))
    );
  }
}
