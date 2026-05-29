/**
 * ConsultationService
 *
 * Manages regulatory consulting session requests.
 * Endpoint base: /api/consultations/
 *
 * Used by: ConsultationsComponent.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Consultation } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private apiUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) {}

  /**
   * Returns the current user's consultation history.
   * Normalizes paginated and non-paginated response shapes.
   *
   * @returns Observable<Consultation[]>.
   */
  getConsultations(): Observable<Consultation[]> {
    return this.http.get<any>(`${this.apiUrl}/`).pipe(
      map(res => res.results ?? res)
    );
  }

  /**
   * Submits a new consultation request.
   *
   * @param payload.topic - High-level subject of the session.
   * @param payload.description - Detailed context for the consultant.
   * @returns Observable<Consultation> — the newly created consultation record.
   */
  createConsultation(payload: { topic: string; description: string }): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/`, payload);
  }
}
