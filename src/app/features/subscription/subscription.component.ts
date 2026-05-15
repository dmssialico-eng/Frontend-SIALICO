import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../core/services/subscription.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { Subscription, Plan } from '../../core/models/models';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, PrimaryButtonComponent],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
  currentSubscription: Subscription | null = null;
  plans: Plan[] = [];
  isLoading = true;

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit() {
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (sub) => {
        this.currentSubscription = sub;
        this.loadPlans();
      },
      error: () => {
        this.loadPlans();
      }
    });
  }

  loadPlans() {
    this.subscriptionService.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
