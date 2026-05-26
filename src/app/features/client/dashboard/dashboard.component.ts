import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { DashboardStats, Subscription, Notification, User } from '../../../shared/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PrimaryButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  stats: DashboardStats | null = null;
  subscription: Subscription | null = null;
  notifications: Notification[] = [];
  user: User | null = null;
  isLoading = true;
  loadError = false;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.loadError = false;
    this.dashboardService.getDashboardData().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.stats         = data.stats;
        this.subscription  = data.subscription;
        this.notifications = data.notifications;
        this.isLoading     = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      }
    });
  }

  /** Returns 0-100 percentage for progress bar; null limit = unlimited (returns 0) */
  limitPercent(used: number, limit: number | null): number {
    if (!limit) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  limitLabel(used: number, limit: number | null): string {
    if (!limit) return `${used} / ∞`;
    return `${used} / ${limit}`;
  }

  isNearLimit(used: number, limit: number | null): boolean {
    if (!limit) return false;
    return used / limit >= 0.8;
  }

  isAtLimit(used: number, limit: number | null): boolean {
    if (!limit) return false;
    return used >= limit;
  }

  get projectsUsed(): number { return this.stats?.active_projects ?? 0; }
  get projectLimit(): number | null { return this.subscription?.plan?.project_limit ?? null; }
  get reviewsUsed(): number  { return this.subscription?.monthly_reviews_used ?? 0; }
  get reviewLimit(): number | null  { return this.subscription?.plan?.monthly_review_limit ?? null; }
}
