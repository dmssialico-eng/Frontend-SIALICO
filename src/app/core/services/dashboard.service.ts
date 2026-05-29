/**
 * DashboardService
 *
 * Aggregates the data required by the client dashboard into a single
 * parallel request using forkJoin, reducing the number of sequential
 * round-trips on initial page load.
 *
 * Sources: ProjectService (stats), SubscriptionService (current plan),
 *          NotificationService (recent alerts).
 *
 * Used by: DashboardComponent.
 */
import { Injectable } from '@angular/core';
import { forkJoin, Observable, map, catchError, of } from 'rxjs';
import { ProjectService } from './project.service';
import { SubscriptionService } from './subscription.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private projectService: ProjectService,
    private subscriptionService: SubscriptionService,
    private notificationService: NotificationService
  ) {}

  /**
   * Fetches all dashboard data in parallel.
   * The subscription request uses catchError so a missing plan does not
   * prevent the rest of the dashboard from rendering.
   * Notifications are pre-sliced to the 5 most recent items.
   *
   * @returns Observable emitting { stats, subscription, notifications }.
   */
  getDashboardData(): Observable<any> {
    return forkJoin({
      stats: this.projectService.getProjectStats(),
      subscription: this.subscriptionService.getCurrentSubscription().pipe(
        catchError(() => of(null))
      ),
      notifications: this.notificationService.getNotifications()
    }).pipe(
      map(data => {
        return {
          stats: data.stats,
          subscription: data.subscription,
          // Normalize paginated vs plain array shapes; cap at 5 items for the dashboard preview.
          notifications: data.notifications.results ? data.notifications.results.slice(0, 5) : data.notifications.slice(0, 5)
        };
      })
    );
  }
}
