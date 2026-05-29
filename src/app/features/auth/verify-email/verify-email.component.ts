/**
 * VerifyEmailComponent
 *
 * Informational holding page shown immediately after registration.
 * Instructs the user to confirm their email address before proceeding.
 *
 * The "confirm" action skips actual token verification on the frontend —
 * the backend is responsible for enforcing email-verified status.
 * Navigating here simply advances the user to the onboarding flow.
 *
 * Route: /verify-email — protected by guestGuard.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SialicoLogoComponent } from '../../../shared/components/sialico-logo/sialico-logo.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, SialicoLogoComponent, PrimaryButtonComponent],
  templateUrl: './verify-email.component.html',
  styleUrls: ['../login/login.component.css']
})
export class VerifyEmailComponent {
  constructor(private router: Router) {}

  /** Advances to onboarding once the user acknowledges the verification prompt. */
  confirm() {
    this.router.navigate(['/onboarding']);
  }
}
