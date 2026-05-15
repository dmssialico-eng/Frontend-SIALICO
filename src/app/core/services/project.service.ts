import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, DashboardStats } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/`);
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}/`);
  }

  createProject(payload: any): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/`, payload);
  }

  updateProject(id: number, payload: any): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}/`, payload);
  }

  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/`);
  }

  getProjectStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats/`);
  }
}
