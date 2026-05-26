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
  private destroyRef = inject(DestroyRef);

  user: User | null = null;
  subscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(u => {
      this.user = u;
    });

    // Reacts to any plan change made in subscription.component (shared BehaviorSubject)
    this.subscriptionService.subscription$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(sub => {
      this.subscription = sub;
    });

    // Trigger the initial fetch — updates subscription$ and all subscribers
    this.subscriptionService.getCurrentSubscription().subscribe({
      error: () => { this.subscription = null; }
    });
  }

  get userInitials(): string {
    if (!this.user || !this.user.full_name) return 'U';
    const names = this.user.full_name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  get planBadgeClass(): string {
    const name = this.subscription?.plan?.name?.toLowerCase() ?? '';
    if (name.includes('enterprise')) return 'badge-enterprise';
    if (name.includes('pro'))        return 'badge-pro';
    if (name.includes('bás') || name.includes('bas') || name.includes('free')) return 'badge-basic';
    return '';
  }
}
