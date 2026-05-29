/**
 * TopUserBarComponent
 *
 * Persistent top bar displayed in both the client and admin layouts.
 * Shows the company name, active plan badge, and the user's initials avatar.
 * Subscribes to the shared subscription$ BehaviorSubject so the plan badge
 * updates immediately when the user changes their plan in SubscriptionComponent.
 *
 * Used by: DashboardLayoutComponent, AdminLayoutComponent.
 */
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { User, Subscription } from '../../../shared/models/models';

@Component({
  selector: 'app-top-user-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-user-bar.component.html',
  styleUrls: ['./top-user-bar.component.css']
})
export class TopUserBarComponent implements OnInit {
  /** Used with takeUntilDestroyed to automatically cancel subscriptions on destroy. */
  private destroyRef = inject(DestroyRef);

  /** Currently authenticated user; null before the user is resolved. */
  user: User | null = null;
  /** The user's active subscription; null when on the free tier or not yet loaded. */
  subscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit() {
    // Track user changes (e.g. profile updates that modify full_name).
    this.authService.currentUser$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(u => {
      this.user = u;
    });

    // React to plan changes made in SubscriptionComponent via the shared BehaviorSubject.
    this.subscriptionService.subscription$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(sub => {
      this.subscription = sub;
    });

    // Trigger the initial subscription fetch, which updates subscription$ for all subscribers.
    this.subscriptionService.getCurrentSubscription().subscribe({
      error: () => { this.subscription = null; }
    });
  }

  /**
   * Returns the user's initials (up to 2 characters) for the avatar circle.
   * Falls back to 'U' when the full name is not yet loaded.
   */
  get userInitials(): string {
    if (!this.user || !this.user.full_name) return 'U';
    const names = this.user.full_name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  /**
   * Returns the CSS class that drives the avatar border color and plan pill style.
   * Derived by matching keywords in the plan name (enterprise, pro, basic/free).
   * Returns an empty string for plans that do not match any tier keyword.
   */
  get planBadgeClass(): string {
    const name = this.subscription?.plan?.name?.toLowerCase() ?? '';
    if (name.includes('enterprise')) return 'badge-enterprise';
    if (name.includes('pro'))        return 'badge-pro';
    if (name.includes('bás') || name.includes('bas') || name.includes('free')) return 'badge-basic';
    return '';
  }
}
