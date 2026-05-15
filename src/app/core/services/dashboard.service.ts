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
          notifications: data.notifications.results ? data.notifications.results.slice(0, 5) : data.notifications.slice(0, 5)
        };
      })
    );
  }
}
