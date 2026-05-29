/**
 * ProjectCreateComponent
 *
 * Form for creating a new regulatory project. The status is hardcoded to
 * ACTIVE on the frontend because newly created projects are always active;
 * the archived state is only reached via the delete (soft-archive) action.
 *
 * A 403 from the API can mean either "no active subscription" or
 * "project limit reached" — the error message is chosen by inspecting the
 * detail string so the user receives actionable feedback for each case.
 *
 * Route: /projects/new — protected by authGuard.
 * Depends on: ProjectService, AuthService.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../../core/services/project.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PrimaryButtonComponent } from '../../../../shared/components/primary-button/primary-button.component';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PrimaryButtonComponent],
  templateUrl: './project-create.component.html',
  styleUrls: ['./project-create.component.css']
})
export class ProjectCreateComponent {
  projectForm: FormGroup;
  /** True while the POST request is in flight; disables the submit button. */
  isSubmitting = false;
  /** Server or validation error message shown below the form. */
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router
  ) {
    this.projectForm = this.fb.group({
      name:        ['', Validators.required],
      description: [''],
    });
  }

  /** Returns the user's company name to pre-populate context in the template; falls back to a generic label. */
  get userCompanyName(): string {
    const user = this.authService.getCurrentUser();
    return user?.company_name || 'Mi Empresa';
  }

  /**
   * Submits the new project with status ACTIVE.
   * Parses the 403 detail message to distinguish between a plan limit error
   * and a general permission error, since both arrive with the same HTTP status.
   */
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
          const detail = err.error?.detail ?? '';
          // The API returns a human-readable detail that includes "limit" or "límite"
          // when the subscription plan cap has been reached.
          if (detail.toLowerCase().includes('limit') || detail.toLowerCase().includes('límite')) {
            this.errorMessage = 'Has alcanzado el límite de proyectos de tu plan actual.';
          } else {
            this.errorMessage = 'No tienes permiso para crear proyectos. Verifica que tu suscripción esté activa o contacta a soporte.';
          }
        } else {
          this.errorMessage = 'Hubo un error al crear el proyecto. Verifica los datos.';
        }
      }
    });
  }
}
