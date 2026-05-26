import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { Subscription, Plan, Payment } from '../../../shared/models/models';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, PrimaryButtonComponent],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  currentSubscription: Subscription | null = null;
  plans: Plan[] = [];
  payments: Payment[] = [];
  isLoading = true;
  isChangingPlan = false;
  showConfirmModal = false;
  showUpdatePaymentModal = false;
  showAdvisorModal = false;
  showBilling = false;
  pendingPlan: Plan | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(
    private subscriptionService: SubscriptionService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.subscriptionService.getCurrentSubscription().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (sub) => {
        this.currentSubscription = sub;
        this.loadPlans();
        this.loadPayments();
      },
      error: () => {
        this.loadPlans();
        this.loadPayments();
      }
    });
  }

  loadPlans() {
    this.subscriptionService.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans.filter(p => p.is_active !== false);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadPayments() {
    this.subscriptionService.getPaymentHistory().subscribe({
      next: (payments) => {
        this.payments = payments;
      },
      error: () => {}
    });
  }

  get reviewsUsed(): number {
    return this.currentSubscription?.monthly_reviews_used ?? 0;
  }

  get reviewsLimit(): number | null {
    return this.currentSubscription?.plan?.monthly_review_limit ?? null;
  }

  get reviewsPercent(): number {
    if (!this.reviewsLimit) return 0;
    return Math.min(100, Math.round((this.reviewsUsed / this.reviewsLimit) * 100));
  }

  get isCurrentPlan(): (plan: Plan) => boolean {
    return (plan: Plan) => this.currentSubscription?.plan?.id === plan.id;
  }

  get lastConfirmedPayment(): Payment | null {
    return this.payments.find(p => p.status === 'CONFIRMED') ?? null;
  }

  viewBilling() {
    this.showBilling = !this.showBilling;
  }

  openUpdatePayment() {
    this.showUpdatePaymentModal = true;
  }

  contactAdvisor() {
    this.showAdvisorModal = true;
  }

  requestPlanChange(plan: Plan) {
    if (this.isCurrentPlan(plan)) return;
    this.pendingPlan = plan;
    this.showConfirmModal = true;
  }

  cancelPlanChange() {
    this.showConfirmModal = false;
    this.pendingPlan = null;
  }

  confirmPlanChange() {
    if (!this.pendingPlan) return;
    this.isChangingPlan = true;
    this.showConfirmModal = false;
    this.successMessage = '';
    this.errorMessage = '';

    // Si ya tiene suscripción activa → cambiar plan (PATCH)
    // Si no tiene suscripción → crear una nueva (POST)
    const action$ = this.currentSubscription
      ? this.subscriptionService.changePlan(this.pendingPlan.id)
      : this.subscriptionService.subscribe(this.pendingPlan.id);

    action$.subscribe({
      next: (updated) => {
        this.currentSubscription = updated;
        this.isChangingPlan = false;
        this.successMessage = `Plan ${this.pendingPlan?.name} activado exitosamente.`;
        this.pendingPlan = null;
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.isChangingPlan = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        this.pendingPlan = null;
        setTimeout(() => this.errorMessage = '', 6000);
      }
    });
  }

  formatCurrency(amount: string, currency: string): string {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: currency || 'MXN' }).format(num);
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      REJECTED: 'Rechazado',
      CANCELLED: 'Cancelado'
    };
    return labels[status] ?? status;
  }

  getConceptLabel(concept: string): string {
    const labels: Record<string, string> = {
      SUBSCRIPTION: 'Suscripción',
      PACKAGE: 'Paquete',
      EXTRA_REVIEW: 'Revisiones extra',
      CONSULTATION: 'Consultoría'
    };
    return labels[concept] ?? concept;
  }
}
