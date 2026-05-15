import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PrimaryButtonComponent],
  templateUrl: './project-create.component.html',
  styleUrls: ['./project-create.component.css']
})
export class ProjectCreateComponent {
  projectForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router
  ) {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  get userCompanyName(): string {
    const user = this.authService.getCurrentUser();
    return user?.company_name || 'Mi Empresa';
  }

  onSubmit() {
    if (this.projectForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      ...this.projectForm.value,
      status: 'ACTIVE'
    };

    this.projectService.createProject(payload).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 403) {
          this.errorMessage = 'Has alcanzado el límite de proyectos de tu plan actual.';
        } else {
          this.errorMessage = 'Hubo un error al crear el proyecto. Verifica los datos.';
        }
      }
    });
  }
}
