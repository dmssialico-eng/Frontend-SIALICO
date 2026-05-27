import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models/models';

export interface ProductFilters {
  status?:   string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/`);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}/`);
  }

  getProductsByProject(projectId: number, filters?: ProductFilters): Observable<any> {
    let params = new HttpParams().set('project', projectId.toString());
    if (filters?.status)   params = params.set('status', filters.status);
    if (filters?.category) params = params.set('category', filters.category);
    return this.http.get<any>(`${this.apiUrl}/`, { params });
  }

  createProduct(payload: any): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/`, payload);
  }
}