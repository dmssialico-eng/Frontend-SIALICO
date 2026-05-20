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

  getCategories(): Observable<ProductCategory[]> {
    return this.http
      .get<any>(`${this.apiUrl}/product-categories/`)
      .pipe(map(res => res.results ?? res));
  }

  getCountries(): Observable<Country[]> {
    return this.http
      .get<any>(`${this.apiUrl}/countries/`)
      .pipe(map(res => res.results ?? res));
  }
}
