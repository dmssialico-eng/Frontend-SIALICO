import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LabelReview, ReviewAttachment, UploadedDocument } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private reviewsUrl     = `${environment.apiUrl}/reviews`;
  private attachmentsUrl = `${environment.apiUrl}/review-attachments`;
  private documentsUrl   = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  /** Lista revisiones, con filtro opcional por label_version */
  getReviews(labelVersionId?: number): Observable<LabelReview[]> {
    const params = labelVersionId
      ? new HttpParams().set('label_version', labelVersionId.toString())
      : new HttpParams();
    return this.http.get<any>(`${this.reviewsUrl}/`, { params }).pipe(
      map(res => res.results ?? res)
    );
  }

  /** Crea una revisión para la versión de etiqueta indicada */
  createReview(labelVersionId: number): Observable<LabelReview> {
    return this.http.post<LabelReview>(`${this.reviewsUrl}/`, {
      label_version: labelVersionId,
    });
  }

  /**
   * Completa la revisión con la decisión final.
   * POST /api/reviews/{id}/complete/
   */
  completeReview(
    reviewId: number,
    payload: {
      status:       'APPROVED' | 'CHANGES_REQUIRED';
      summary:      string;
      observations: string;
    }
  ): Observable<LabelReview> {
    return this.http.post<LabelReview>(
      `${this.reviewsUrl}/${reviewId}/complete/`,
      payload
    );
  }

  /**
   * Sube un archivo adjunto a la revisión en 2 pasos:
   *   1. POST /api/documents/ — sube el archivo
   *   2. POST /api/review-attachments/ — asocia el documento a la revisión
   */
  uploadAttachment(
    reviewId:       number,
    file:           File,
    attachmentType: 'OBSERVATION_DOC' | 'MARKED_LABEL' | 'REFERENCE_IMAGE'
  ): Observable<ReviewAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadedDocument>(`${this.documentsUrl}/`, formData).pipe(
      switchMap(doc =>
        this.http.post<ReviewAttachment>(`${this.attachmentsUrl}/`, {
          review:          reviewId,
          document:        doc.id,
          attachment_type: attachmentType,
        })
      )
    );
  }

  getAttachments(reviewId: number): Observable<ReviewAttachment[]> {
    const params = new HttpParams().set('review', reviewId.toString());
    return this.http.get<any>(`${this.attachmentsUrl}/`, { params }).pipe(
      map(res => res.results ?? res)
    );
  }
}
