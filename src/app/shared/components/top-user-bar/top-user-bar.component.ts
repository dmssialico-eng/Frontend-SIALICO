import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { User, Subscription } from '../../../core/models/models';

@Component({
  selector: 'app-top-user-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-user-bar.component.html',
  styleUrls: ['./top-user-bar.component.css']
})
export class TopUserBarComponent implements OnInit {
  user: User | null = null;
  subscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
    });

    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (sub) => {
        this.subscription = sub;
      },
      error: () => {
        // If 404, subscription is null
        this.subscription = null;
      }
    });
  }

  get userInitials(): string {
    if (!this.user || !this.user.full_name) return 'U';
    const names = this.user.full_name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
}
