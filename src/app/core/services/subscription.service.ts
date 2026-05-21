import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Plan, Subscription } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private apiUrl = environment.apiUrl;

  private subscriptionCache$ = new BehaviorSubject<Subscription | null | undefined>(undefined);

  constructor(private http: HttpClient) {}

  getPlans(): Observable<Plan[]> {
    return this.http
      .get<any>(`${this.apiUrl}/plans/`)
      .pipe(map(res => res.results ?? res));
  }

  getCurrentSubscription(): Observable<Subscription | null> {
    const cached = this.subscriptionCache$.value;
    if (cached !== undefined) {
      return of(cached);
    }

    return this.http
      .get<Subscription>(`${this.apiUrl}/subscriptions/current/`)
      .pipe(
        tap(sub => this.subscriptionCache$.next(sub)),
        catchError(err => {
          if (err.status === 404) {
            this.subscriptionCache$.next(null);
            return of(null);
          }
          this.subscriptionCache$.next(null);
          return of(null);
        })
      );
  }

  clearCache(): void {
    this.subscriptionCache$.next(undefined);
  }
}