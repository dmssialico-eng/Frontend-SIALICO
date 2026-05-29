/**
 * ProjectService
 *
 * Handles all CRUD operations for Project entities and provides the
 * aggregated stats endpoint used by the client dashboard.
 *
 * Endpoint base: /api/projects/
 *
 * Used by: ProjectListComponent, ProjectDetailComponent,
 *          ProjectCreateComponent, DashboardService.
 */
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

  /**
   * Returns all projects owned by the current user.
   *
   * @returns Observable of the raw server response.
   */
  getProjects(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/`);
  }

  /**
   * Fetches a single project by its primary key.
   *
   * @param id - Project primary key.
   * @returns Observable<Project>.
   */
  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Creates a new project via POST /api/projects/.
   *
   * @param payload - Project data including name, description, and status.
   * @returns Observable<Project> — the created project record.
   */
  createProject(payload: any): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/`, payload);
  }

  /**
   * Replaces all project fields via PUT /api/projects/{id}/.
   *
   * @param id      - Project primary key.
   * @param payload - Full updated project data.
   * @returns Observable<Project> — the updated project record.
   */
  updateProject(id: number, payload: any): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}/`, payload);
  }

  /**
   * Soft-deletes (archives) a project via DELETE /api/projects/{id}/.
   * The backend sets the project status to ARCHIVED rather than destroying the record.
   *
   * @param id - Project primary key.
   * @returns Observable of the server response.
   */
  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/`);
  }

  /**
   * Returns aggregated project counts per status used by the dashboard summary cards.
   *
   * @returns Observable<DashboardStats>.
   */
  getProjectStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats/`);
  }
}
