import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Plan, Subscription } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.apiUrl}/plans/`);
  }

  getCurrentSubscription(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/subscriptions/current/`);
  }
}
