import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { SialicoLogoComponent } from '../../shared/components/sialico-logo/sialico-logo.component';
import { Plan } from '../../core/models/models';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimaryButtonComponent, SialicoLogoComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent implements OnInit {
  currentStep = 1;
  companyForm: FormGroup;
  isSubmitting = false;
  isLoadingPlans = false;
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
        next: () => {
          this.isSubmitting = false;
          this.currentStep++;
        },
        error: () => {
          this.isSubmitting = false;
          this.currentStep++;
        }
      });
    }
  }

  prevStep() {
    this.currentStep--;
  }

  selectPlan(plan: Plan) {
    if (plan.plan_type === 'FREE' || (plan.price === '0.00' || plan.price === '0')) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.subscriptionService.subscribe(plan.id).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isSubmitting = false;
        this.router.navigate(['/dashboard']);
      }
    });
  }

  getPlanButtonLabel(plan: Plan): string {
    if (plan.plan_type === 'FREE' || plan.price === '0.00' || plan.price === '0') {
      return 'Comenzar gratis';
    }
    if (plan.plan_type === 'CONSULTING' || plan.plan_type === 'FULL') {
      return 'Contactar asesor';
    }
    return 'Seleccionar plan';
  }

  isFreePlan(plan: Plan): boolean {
    return plan.plan_type === 'FREE' || plan.price === '0.00' || plan.price === '0';
  }

  isRecommended(plan: Plan): boolean {
    return plan.plan_type === 'PAID';
  }
}
