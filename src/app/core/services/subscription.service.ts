import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Plan, Subscription, Payment } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private apiUrl = environment.apiUrl;

  private _subscription$ = new BehaviorSubject<Subscription | null>(null);
  /** Observable compartido — cualquier componente puede suscribirse para reaccionar a cambios de plan. */
  readonly subscription$ = this._subscription$.asObservable();

  constructor(private http: HttpClient) {}

  getPlans(): Observable<Plan[]> {
    return this.http.get<any>(`${this.apiUrl}/plans/`).pipe(
      map(response => Array.isArray(response) ? response : (response.results ?? []))
    );
  }

  getCurrentSubscription(): Observable<Subscription | null> {
    return this.http.get<Subscription | null>(`${this.apiUrl}/subscriptions/current/`).pipe(
      tap(sub => this._subscription$.next(sub))
    );
  }

  getPaymentHistory(): Observable<Payment[]> {
    return this.http.get<any>(`${this.apiUrl}/payments/`).pipe(
      map(response => Array.isArray(response) ? response : (response.results ?? []))
    );
  }

  changePlan(planId: number): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.apiUrl}/subscriptions/current/`, { plan: planId }).pipe(
      tap(sub => this._subscription$.next(sub))
    );
  }

  subscribe(planId: number): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.apiUrl}/subscriptions/`, { plan: planId }).pipe(
      tap(sub => this._subscription$.next(sub))
    );
  }
}