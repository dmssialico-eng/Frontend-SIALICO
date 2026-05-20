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

  // ── Labels ────────────────────────────────────────────────────────────────

  getLabelsByProduct(productId: number): Observable<Label[]> {
    const params = new HttpParams().set('product', productId.toString());
    return this.http.get<any>(`${this.labelsUrl}/`, { params }).pipe(
      map(res => res.results ?? res)
    );
  }

  getLabelDetail(id: number): Observable<Label> {
    return this.http.get<Label>(`${this.labelsUrl}/${id}/`);
  }

  createLabel(productId: number): Observable<Label> {
    return this.http.post<Label>(`${this.labelsUrl}/`, { product: productId });
  }

  getAllLabels(status?: string): Observable<any> {
    const params = status
      ? new HttpParams().set('status', status.toUpperCase())
      : new HttpParams();
    return this.http.get<any>(`${this.labelsUrl}/`, { params });
  }

  // ── Label Versions ────────────────────────────────────────────────────────

  getLabelVersions(labelId: number): Observable<LabelVersion[]> {
    const params = new HttpParams().set('label', labelId.toString());
    return this.http.get<any>(`${this.versionsUrl}/`, { params }).pipe(
      map(res => res.results ?? res)
    );
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  uploadDocument(file: File, productId?: number): Observable<UploadedDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (productId) formData.append('product', productId.toString());
    return this.http.post<UploadedDocument>(`${this.documentsUrl}/`, formData);
  }

  // ── Flujo completo: Document → (Label) → LabelVersion ────────────────────

  /**
   * Sube una nueva versión de etiqueta en 3 pasos:
   *   1. POST /api/documents/  — sube el archivo físico
   *   2. POST /api/labels/     — crea el contenedor Label (solo si no existe)
   *   3. POST /api/label-versions/ — crea la LabelVersion con referencia al Document
   */
  submitLabelVersion(params: {
    productId: number;
    labelId:   number | null;
    file:      File;
    notes:     string;
  }): Observable<LabelVersion> {
    return this.uploadDocument(params.file, params.productId).pipe(
      switchMap(doc => {
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
