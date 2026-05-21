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
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      company_name: ['', Validators.required],
      industry: [''], // frontend only field based on screenshot
      export_interest: [''], // frontend only
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      full_name: this.registerForm.value.full_name,
      email: this.registerForm.value.email,
      company_name: this.registerForm.value.company_name,
      password: this.registerForm.value.password
    };

    this.authService.register(payload).subscribe({
      next: () => {
        // Auto login or redirect to verify-email
        this.router.navigate(['/verify-email']);
      },
      error: (err) => {
        this.errorMessage = 'Hubo un error al crear la cuenta.';
        this.isLoading = false;
      }
    });
  }
}