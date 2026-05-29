/**
 * CatalogService
 *
 * Fetches read-only reference data used to populate select inputs:
 * product categories and target export countries.
 *
 * Endpoints: GET /api/product-categories/, GET /api/countries/
 *
 * Used by: ProjectDetailComponent (product creation form).
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProductCategory, Country } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Returns all active product categories.
   * Normalizes paginated and non-paginated response shapes.
   *
   * @returns Observable<ProductCategory[]>.
   */
  getCategories(): Observable<ProductCategory[]> {
    return this.http
      .get<any>(`${this.apiUrl}/product-categories/`)
      .pipe(map(res => res.results ?? res));
  }

  /**
   * Returns all supported target export countries.
   * Normalizes paginated and non-paginated response shapes.
   *
   * @returns Observable<Country[]>.
   */
  getCountries(): Observable<Country[]> {
    return this.http
      .get<any>(`${this.apiUrl}/countries/`)
      .pipe(map(res => res.results ?? res));
  }
}
