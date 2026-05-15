import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { SialicoLogoComponent } from '../../shared/components/sialico-logo/sialico-logo.component';

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

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.companyForm = this.fb.group({
      company_name: ['', Validators.required],
      industry: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {}

  nextStep() {
    if (this.currentStep === 1 && this.companyForm.invalid) {
      // In a real app we might mark as touched to show errors
      return;
    }
    this.currentStep++;
  }

  prevStep() {
    this.currentStep--;
  }

  selectPlan(planName: string) {
    // In a full implementation, you would call SubscriptionService to activate the plan.
    // Since the demo requires no complex payment gateway for now, we just proceed.
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      this.router.navigate(['/dashboard']);
    }, 1000);
  }
}
