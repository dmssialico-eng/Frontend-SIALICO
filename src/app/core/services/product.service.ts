import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/`);
  }

  getProductsByProject(projectId: number): Observable<any> {
    const params = new HttpParams().set('project', projectId.toString());
    return this.http.get<any>(`${this.apiUrl}/`, { params });
  }

  createProduct(payload: any): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/`, payload);
  }
}
