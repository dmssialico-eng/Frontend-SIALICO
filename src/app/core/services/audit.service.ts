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

  getLogs(params?: { entity?: string; actor?: string; page?: number }): Observable<{ results: AuditLog[]; count: number }> {
    let httpParams = new HttpParams();
    if (params?.entity) httpParams = httpParams.set('entity_name', params.entity);
    if (params?.actor)  httpParams = httpParams.set('actor_email', params.actor);
    if (params?.page)   httpParams = httpParams.set('page', String(params.page));

    return this.http.get<any>(`${this.apiUrl}/`, { params: httpParams }).pipe(
      map(res => ({
        results: res.results ?? res,
        count:   res.count   ?? (res.results ?? res).length,
      }))
    );
  }
}
