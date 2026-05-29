/**
 * LabelService
 *
 * Manages all label-related operations: fetching labels and their versions,
 * uploading documents, and the full 3-step label version submission flow.
 *
 * Endpoints used:
 *   GET/POST /api/labels/
 *   GET      /api/labels/{id}/
 *   GET      /api/label-versions/
 *   POST     /api/label-versions/
 *   POST     /api/documents/
 *
 * Used by: ProductDetailComponent, LabelDetailComponent,
 *          LabelUploadComponent, AdminLabelsComponent,
 *          AdminLabelReviewComponent, AdminDashboardComponent.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Label, LabelVersion, UploadedDocument } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LabelService {
  private labelsUrl    = `${environment.apiUrl}/labels`;
  private versionsUrl  = `${environment.apiUrl}/label-versions`;
  private documentsUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  /**
   * Returns all labels for a given product.
   *
   * @param productId - The product's primary key.
   * @returns Observable<Label[]>.
   */
  getLabelsByProduct(productId: number): Observable<Label[]> {
    const params = new HttpParams().set('product', productId.toString());
    return this.http.get<any>(`${this.labelsUrl}/`, { params }).pipe(
      map(res => res.results ?? res)
    );
  }

  /**
   * Fetches the full detail of a single label.
   *
   * @param id - Label primary key.
   * @returns Observable<Label>.
   */
  getLabelDetail(id: number): Observable<Label> {
    return this.http.get<Label>(`${this.labelsUrl}/${id}/`);
  }

  /**
   * Creates a new root Label entity for a product.
   * Called by submitLabelVersion() when no prior label exists.
   *
   * @param productId - Foreign key of the product that owns the label.
   * @returns Observable<Label>.
   */
  createLabel(productId: number): Observable<Label> {
    return this.http.post<Label>(`${this.labelsUrl}/`, { product: productId });
  }

  /**
   * Returns all labels, with optional status filter. Used in admin views.
   *
   * @param status - Optional status string (e.g. 'SUBMITTED'); pass 'all' to skip filtering.
   * @returns Observable of the raw paginated response.
   */
  getAllLabels(status?: string): Observable<any> {
    let params = new HttpParams();
    if (status && status !== 'all') {
      params = params.set('current_status', status.toUpperCase());
    }
    return this.http.get<any>(`${this.labelsUrl}/`, { params });
  }

  /**
   * Returns all label versions for a given parent label, sorted descending by the caller.
   *
   * @param labelId - Label primary key.
   * @returns Observable<LabelVersion[]>.
   */
  getLabelVersions(labelId: number): Observable<LabelVersion[]> {
    const params = new HttpParams().set('label', labelId.toString());
    return this.http.get<any>(`${this.versionsUrl}/`, { params }).pipe(
      map(res => res.results ?? res)
    );
  }

  /**
   * Uploads a file to the document store via multipart POST /api/documents/.
   *
   * @param file - The file to upload.
   * @param productId - Optional product association stored alongside the document.
   * @returns Observable<UploadedDocument> — the created document record.
   */
  uploadDocument(file: File, productId?: number): Observable<UploadedDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (productId) formData.append('product', productId.toString());
    return this.http.post<UploadedDocument>(`${this.documentsUrl}/`, formData);
  }

  /**
   * Executes the full 3-step label version submission flow sequentially:
   *   1. Upload the file to /api/documents/.
   *   2. Reuse the existing Label or create a new one if none exists.
   *   3. Create a LabelVersion linking the document to the label.
   *
   * @param params.productId - Product that owns the label.
   * @param params.labelId   - Existing label ID; null triggers label creation.
   * @param params.file      - The label document file.
   * @param params.notes     - Optional reviewer notes for this version.
   * @returns Observable<LabelVersion> — the newly created version.
   */
  submitLabelVersion(params: {
    productId: number;
    labelId:   number | null;
    file:      File;
    notes:     string;
  }): Observable<LabelVersion> {
    return this.uploadDocument(params.file, params.productId).pipe(
      switchMap(doc => {
        // Reuse existing label or create a new one if this is the first submission.
        const label$: Observable<{ id: number }> = params.labelId
          ? of({ id: params.labelId })
          : this.createLabel(params.productId);

        return label$.pipe(
          switchMap(label =>
            this.http.post<LabelVersion>(`${this.versionsUrl}/`, {
              label:    label.id,
              document: doc.id,
              notes:    params.notes,
            })
          )
        );
      })
    );
  }
}