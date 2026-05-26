import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { SialicoLogoComponent } from '../../../shared/components/sialico-logo/sialico-logo.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    SialicoLogoComponent,
    PrimaryButtonComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading    = false;
  errorMessage = '';
  showPassword = false;

  features = [
    'Gestión de etiquetas FDA y COFEPRIS',
    'Revisión profesional por especialistas',
    'Seguimiento de proyectos en tiempo real',
    'Notificaciones automáticas de cambios',
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading    = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        const roleName = this.authService.getRoleName();
        // CONSULTANT y CLIENT van al mismo lugar por ahora.
        // Cuando se implemente el área de consultant, cambiar aquí.
        const destination = roleName === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
        this.router.navigate([destination]).finally(() => {
          this.isLoading = false;
        });
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
        } else {
          this.errorMessage = 'Error de conexión. Intenta de nuevo más tarde.';
        }
        this.isLoading = false;
      }
    });
  }
}
