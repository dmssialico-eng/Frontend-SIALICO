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

  getConsultations(): Observable<Consultation[]> {
    return this.http.get<any>(`${this.apiUrl}/`).pipe(
      map(res => res.results ?? res)
    );
  }

  createConsultation(payload: { topic: string; description: string }): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/`, payload);
  }
}
