/**
 * RegisterComponent
 *
 * Handles new user self-registration. Collects the minimum required fields
 * (full_name, email, company_name, password) and POSTs to AuthService.register().
 * On success, redirects to /verify-email so the user can confirm their address
 * before accessing the application.
 *
 * Route: /register — protected by guestGuard.
 * Depends on: AuthService.
 * Reuses login page CSS layout via styleUrls reference.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SialicoLogoComponent } from '../../../shared/components/sialico-logo/sialico-logo.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SialicoLogoComponent, PrimaryButtonComponent, LucideAngularModule],
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.css'] // reuse login layout styles
})
export class RegisterComponent {
  registerForm: FormGroup;
  /** True while the registration HTTP request is in flight. */
  isLoading = false;
  /** Displays a server-side error message below the form. */
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      full_name:       ['', Validators.required],
      email:           ['', [Validators.required, Validators.email]],
      company_name:    ['', Validators.required],
      // industry and export_interest are collected in the UI but not sent to the
      // backend — they are captured for onboarding UX only and excluded from the payload.
      industry:        [''],
      export_interest: [''],
      password:        ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  /**
   * Strips the UI-only fields before posting to the API,
   * then navigates to the email verification holding page on success.
   */
  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading    = true;
    this.errorMessage = '';

    // industry and export_interest are intentionally omitted — the API does not accept them yet.
    const payload = {
      full_name:    this.registerForm.value.full_name,
      email:        this.registerForm.value.email,
      company_name: this.registerForm.value.company_name,
      password:     this.registerForm.value.password
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.router.navigate(['/verify-email']);
      },
      error: () => {
        this.errorMessage = 'Hubo un error al crear la cuenta.';
        this.isLoading    = false;
      }
    });
  }
}