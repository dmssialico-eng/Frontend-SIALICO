import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimaryButtonComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm!: FormGroup;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.profileForm = this.fb.group({
      full_name:    [this.user?.full_name    || '', Validators.required],
      company_name: [this.user?.company_name || ''],
      phone:        [this.user?.phone        || ''],
    });
  }

  saveChanges() {
    if (this.profileForm.invalid || this.isSaving) return;
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: (updatedUser) => {
        // Actualizar el BehaviorSubject con los datos nuevos
        this.authService.me().subscribe();
        this.successMessage = 'Perfil actualizado correctamente.';
        this.isSaving = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar el perfil. Intenta de nuevo.';
        this.isSaving = false;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}