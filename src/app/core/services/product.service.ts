/**
 * ProductService
 *
 * Manages CRUD operations for product entities within a project.
 * Endpoint base: /api/products/
 *
 * Used by: ProjectDetailComponent, ProductDetailComponent.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models/models';

/** Optional filters applied when listing products for a given project. */
export interface ProductFilters {
  /** Filter by regulatory status (e.g. 'APPROVED'). */
  status?:   string;
  /** Filter by product category ID. */
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  /**
   * Returns all products visible to the current user (no project filter).
   *
   * @returns Observable of the raw server response.
   */
  getProducts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/`);
  }

  /**
   * Fetches a single product by its primary key.
   *
   * @param id - Product primary key.
   * @returns Observable<Product>.
   */
  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Returns all products belonging to a project, with optional status
   * and category filters applied as query parameters.
   *
   * @param projectId - Parent project primary key.
   * @param filters   - Optional status and category filter values.
   * @returns Observable of the raw server response.
   */
  getProductsByProject(projectId: number, filters?: ProductFilters): Observable<any> {
    let params = new HttpParams().set('project', projectId.toString());
    if (filters?.status)   params = params.set('status', filters.status);
    if (filters?.category) params = params.set('category', filters.category);
    return this.http.get<any>(`${this.apiUrl}/`, { params });
  }

  /**
   * Creates a new product via POST /api/products/.
   *
   * @param payload - Product data including project FK, name, category, and target country.
   * @returns Observable<Product> — the created product record.
   */
  createProduct(payload: any): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/`, payload);
  }
}