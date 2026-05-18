import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Label, LabelReviewPayload } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LabelService {
  private apiUrl = `${environment.apiUrl}/labels`;

  constructor(private http: HttpClient) {}

  getLabelsByProduct(productId: number): Observable<Label[]> {
    const params = new HttpParams().set('product', productId.toString());
    return this.http.get<Label[]>(`${this.apiUrl}/`, { params });
  }

  getLabelDetail(id: number): Observable<Label> {
    return this.http.get<Label>(`${this.apiUrl}/${id}/`);
  }

  // Subir etiqueta (multipart/form-data)
  uploadLabel(formData: FormData): Observable<Label> {
    return this.http.post<Label>(`${this.apiUrl}/`, formData);
  }

  getAllLabels(status?: string): Observable<any> {
    const params = status
      ? new HttpParams().set('status', status)
      : new HttpParams();
    return this.http.get<any>(`${this.apiUrl}/`, { params });
  }

  // Admin: enviar revisión (aprobar o pedir cambios)
  reviewLabel(id: number, payload: LabelReviewPayload): Observable<Label> {
    return this.http.patch<Label>(`${this.apiUrl}/${id}/review/`, payload);
  }

  // Admin: subir archivo de retroalimentación
  uploadFeedbackFile(id: number, file: File): Observable<Label> {
    const formData = new FormData();
    formData.append('feedback_file', file);
    return this.http.patch<Label>(`${this.apiUrl}/${id}/feedback-file/`, formData);
  }
}