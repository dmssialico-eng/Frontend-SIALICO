/**
 * DashboardComponent
 *
 * Client home screen. Aggregates stats, the active subscription, and the
 * most recent notifications in a single forkJoin call via DashboardService.
 * Displays usage meters for projects and monthly label reviews relative to
 * the plan's configured limits.
 *
 * Route: /dashboard — protected by authGuard.
 * Depends on: DashboardService, AuthService.
 */
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

  /** Counters returned by the /dashboard/stats endpoint. */
  stats: DashboardStats | null = null;
  /** The user's current subscription including plan limits. */
  subscription: Subscription | null = null;
  /** Latest 5 notifications pre-fetched by DashboardService for the activity feed. */
  notifications: Notification[] = [];
  /** Currently logged-in user; read from in-memory AuthService cache to avoid an extra HTTP call. */
  user: User | null = null;
  /** True while the initial data load is in flight. */
  isLoading = true;
  /** True when the data fetch fails; allows the template to show a retry button. */
  loadError = false;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.loadData();
  }

  /** Fetches all dashboard data via forkJoin; resets error state before each attempt. */
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

  /** Returns 0-100 percentage for the usage progress bar; null limit (unlimited plan) returns 0. */
  limitPercent(used: number, limit: number | null): number {
    if (!limit) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  /** Formats the "X / Y" usage label; renders ∞ when the plan has no limit. */
  limitLabel(used: number, limit: number | null): string {
    if (!limit) return `${used} / ∞`;
    return `${used} / ${limit}`;
  }

  /** Returns true when usage has reached 80% of the limit — used to show a warning color. */
  isNearLimit(used: number, limit: number | null): boolean {
    if (!limit) return false;
    return used / limit >= 0.8;
  }

  /** Returns true when the limit is fully consumed — used to show an error/blocked state. */
  isAtLimit(used: number, limit: number | null): boolean {
    if (!limit) return false;
    return used >= limit;
  }

  /** Number of currently active projects, sourced from stats to avoid re-fetching. */
  get projectsUsed(): number { return this.stats?.active_projects ?? 0; }
  /** Maximum projects allowed by the active plan; null means unlimited. */
  get projectLimit(): number | null { return this.subscription?.plan?.project_limit ?? null; }
  /** Label reviews consumed in the current billing month. */
  get reviewsUsed(): number  { return this.subscription?.monthly_reviews_used ?? 0; }
  /** Maximum label reviews per month allowed by the active plan; null means unlimited. */
  get reviewLimit(): number | null  { return this.subscription?.plan?.monthly_review_limit ?? null; }
}
