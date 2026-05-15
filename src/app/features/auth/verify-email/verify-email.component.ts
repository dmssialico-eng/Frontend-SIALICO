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

  confirm() {
    this.router.navigate(['/onboarding']);
  }
}
