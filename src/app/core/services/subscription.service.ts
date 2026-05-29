/**
 * SubscriptionService
 *
 * Manages subscription and plan operations for the current user.
 * Exposes a shared BehaviorSubject so multiple components (TopUserBarComponent,
 * SubscriptionComponent, DashboardComponent) stay in sync without extra HTTP calls.
 *
 * Endpoints used:
 *   GET  /api/plans/
 *   GET  /api/subscriptions/current/
 *   POST /api/subscriptions/
 *   PATCH /api/subscriptions/current/
 *   GET  /api/payments/
 *
 * Used by: TopUserBarComponent, SubscriptionComponent, DashboardService,
 *          OnboardingComponent, AuthService.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Plan, Subscription, Payment } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private apiUrl = environment.apiUrl;

  /** Internal store for the current subscription state. */
  private _subscription$ = new BehaviorSubject<Subscription | null>(null);
  /** Shared observable — any component can subscribe to react to plan changes. */
  readonly subscription$ = this._subscription$.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Returns all active subscription plans available on the platform.
   * Normalizes paginated and non-paginated response shapes.
   *
   * @returns Observable<Plan[]>.
   */
  getPlans(): Observable<Plan[]> {
    return this.http.get<any>(`${this.apiUrl}/plans/`).pipe(
      map(response => Array.isArray(response) ? response : (response.results ?? []))
    );
  }

  /**
   * Fetches the current user's active subscription and updates the shared observable.
   * Any subscriber to subscription$ will receive the updated value automatically.
   *
   * @returns Observable<Subscription | null> — null when the user has no active subscription.
   */
  getCurrentSubscription(): Observable<Subscription | null> {
    return this.http.get<Subscription | null>(`${this.apiUrl}/subscriptions/current/`).pipe(
      tap(sub => this._subscription$.next(sub))
    );
  }

  /**
   * Returns the payment history for the current user.
   * Normalizes paginated and non-paginated response shapes.
   *
   * @returns Observable<Payment[]>.
   */
  getPaymentHistory(): Observable<Payment[]> {
    return this.http.get<any>(`${this.apiUrl}/payments/`).pipe(
      map(response => Array.isArray(response) ? response : (response.results ?? []))
    );
  }

  /**
   * Changes the plan on an existing subscription via PATCH /api/subscriptions/current/.
   * Updates the shared subscription$ observable so all subscribers reflect the change.
   *
   * @param planId - Primary key of the plan to switch to.
   * @returns Observable<Subscription> — the updated subscription.
   */
  changePlan(planId: number): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.apiUrl}/subscriptions/current/`, { plan: planId }).pipe(
      tap(sub => this._subscription$.next(sub))
    );
  }

  /**
   * Creates a new subscription for a user who has no current plan
   * via POST /api/subscriptions/.
   * Updates the shared subscription$ observable.
   *
   * @param planId - Primary key of the plan to subscribe to.
   * @returns Observable<Subscription> — the newly created subscription.
   */
  subscribe(planId: number): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.apiUrl}/subscriptions/`, { plan: planId }).pipe(
      tap(sub => this._subscription$.next(sub))
    );
  }

  /**
   * Resets the cached subscription to null.
   * Called by AuthService on logout and login to prevent stale plan data
   * from being displayed for a new session.
   */
  clearCache(): void {
    this._subscription$.next(null);
  }
}
