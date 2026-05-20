import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, CheckCircle2, Globe2, Zap, Check, Info } from 'lucide-angular';
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

  readonly Mail         = Mail;
  readonly Lock         = Lock;
  readonly Eye          = Eye;
  readonly EyeOff       = EyeOff;
  readonly AlertCircle  = AlertCircle;
  readonly ShieldCheck  = ShieldCheck;
  readonly CheckCircle2 = CheckCircle2;
  readonly Globe2       = Globe2;
  readonly Zap          = Zap;
  readonly Check        = Check;
  readonly Info         = Info;

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
        if (roleName === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (roleName === 'CONSULTANT') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
        this.isLoading = false;
      }
    });
  }
}
