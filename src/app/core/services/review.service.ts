/**
 * ReviewService
 *
 * Manages the full admin review workflow for label versions:
 * fetching existing reviews, creating new ones, completing them with
 * an APPROVED / CHANGES_REQUIRED decision, and uploading attachments.
 *
 * Endpoints used:
 *   GET/POST   /api/reviews/
 *   POST       /api/reviews/{id}/complete/
 *   GET/POST   /api/review-attachments/
 *   POST       /api/documents/
 *
 * Used by: AdminLabelReviewComponent.
 */
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

  /**
   * Returns reviews for a specific label version, or all reviews if no ID is given.
   *
   * @param labelVersionId - Optional filter for a specific LabelVersion primary key.
   * @returns Observable<LabelReview[]>.
   */
  getReviews(labelVersionId?: number): Observable<LabelReview[]> {
    const params = labelVersionId
      ? new HttpParams().set('label_version', labelVersionId.toString())
      : new HttpParams();
    return this.http.get<any>(`${this.reviewsUrl}/`, { params }).pipe(
      map(res => res.results ?? res)
    );
  }

  /**
   * Creates a new review record for a label version via POST /api/reviews/.
   * The review starts in PENDING status; it must be completed via completeReview().
   *
   * @param labelVersionId - Primary key of the LabelVersion to review.
   * @returns Observable<LabelReview> — the newly created review.
   */
  createReview(labelVersionId: number): Observable<LabelReview> {
    return this.http.post<LabelReview>(`${this.reviewsUrl}/`, {
      label_version: labelVersionId,
    });
  }

  /**
   * Finalizes a review with the admin's decision.
   * Calls POST /api/reviews/{id}/complete/ which transitions the review
   * and the linked LabelVersion to APPROVED or CHANGES_REQUIRED.
   *
   * @param reviewId        - Primary key of the review to complete.
   * @param payload.status  - Final decision: 'APPROVED' or 'CHANGES_REQUIRED'.
   * @param payload.summary - Short executive summary visible to the client.
   * @param payload.observations - Detailed feedback; required for CHANGES_REQUIRED.
   * @returns Observable<LabelReview> — the updated review record.
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
   * Uploads an attachment to a review in two sequential steps:
   *   1. POST /api/documents/ — stores the file and returns a document record.
   *   2. POST /api/review-attachments/ — links the document to the review.
   *
   * @param reviewId       - Primary key of the parent review.
   * @param file           - The file to attach.
   * @param attachmentType - Classification of the attachment purpose.
   * @returns Observable<ReviewAttachment> — the created attachment record.
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

  /**
   * Returns all attachments for a given review.
   *
   * @param reviewId - Review primary key.
   * @returns Observable<ReviewAttachment[]>.
   */
  getAttachments(reviewId: number): Observable<ReviewAttachment[]> {
    const params = new HttpParams().set('review', reviewId.toString());
    return this.http.get<any>(`${this.attachmentsUrl}/`, { params }).pipe(
      map(res => res.results ?? res)
    );
  }
}
