/**
 * OnboardingComponent
 *
 * Two-step post-registration wizard:
 *   Step 1 — Collects the company name and industry and PATCHes the user profile.
 *   Step 2 — Presents available plans; selecting a free plan navigates directly
 *             to the dashboard while selecting a paid plan calls subscribe().
 *
 * On any error in step 1, the wizard still advances so the user is not blocked
 * from completing onboarding if the profile update fails.
 *
 * Route: /onboarding — protected by authGuard.
 * Depends on: UserService, SubscriptionService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SialicoLogoComponent } from '../../../shared/components/sialico-logo/sialico-logo.component';
import { Plan } from '../../../shared/models/models';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimaryButtonComponent, SialicoLogoComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent implements OnInit {
  /** 1-based step counter; the template switches between step 1 (company info) and step 2 (plan selection). */
  currentStep = 1;
  companyForm: FormGroup;
  /** True while the profile PATCH (step 1) or subscription POST (step 2) is in flight. */
  isSubmitting = false;
  /** True while the plan list is being fetched on init. */
  isLoadingPlans = false;
  /** Active plans available for the user to choose from; inactive plans are filtered out. */
  plans: Plan[] = [];
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private router: Router
  ) {
    this.companyForm = this.fb.group({
      company_name: ['', Validators.required],
      industry: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.isLoadingPlans = true;
    this.subscriptionService.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans.filter(p => p.is_active !== false);
        this.isLoadingPlans = false;
      },
      error: () => {
        this.isLoadingPlans = false;
      }
    });
  }

  /**
   * Advances from step 1 to step 2 by PATCHing the user's company_name.
   * On both success and error the wizard still advances — the profile update
   * is best-effort and should not block the user from choosing a plan.
   */
  nextStep() {
    if (this.currentStep === 1) {
      if (this.companyForm.invalid) {
        this.companyForm.markAllAsTouched();
        return;
      }
      this.isSubmitting = true;
      this.errorMessage = '';
      const { company_name } = this.companyForm.value;
      this.userService.updateProfile({ company_name }).subscribe({
        next:  () => { this.isSubmitting = false; this.currentStep++; },
        error: () => { this.isSubmitting = false; this.currentStep++; }
      });
    }
  }

  prevStep() {
    this.currentStep--;
  }

  /**
   * Handles plan selection at the end of onboarding.
   * Free plans navigate directly to the dashboard without an API call.
   * Paid plans call subscribe(); on either success or error the user is still
   * redirected to the dashboard so onboarding always completes.
   */
  selectPlan(plan: Plan) {
    if (plan.plan_type === 'FREE' || plan.price === '0.00' || plan.price === '0') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.subscriptionService.subscribe(plan.id).subscribe({
      next:  () => { this.isSubmitting = false; this.router.navigate(['/dashboard']); },
      error: () => { this.isSubmitting = false; this.router.navigate(['/dashboard']); }
    });
  }

  /** Returns the CTA label for a plan card based on its type and price. */
  getPlanButtonLabel(plan: Plan): string {
    if (plan.plan_type === 'FREE' || plan.price === '0.00' || plan.price === '0') return 'Comenzar gratis';
    if (plan.plan_type === 'CONSULTING' || plan.plan_type === 'FULL') return 'Contactar asesor';
    return 'Seleccionar plan';
  }

  /** Returns true when a plan is free; used to skip the subscribe call for free plans. */
  isFreePlan(plan: Plan): boolean {
    return plan.plan_type === 'FREE' || plan.price === '0.00' || plan.price === '0';
  }

  /** Returns true for the PAID tier, which the template highlights as the recommended option. */
  isRecommended(plan: Plan): boolean {
    return plan.plan_type === 'PAID';
  }
}
