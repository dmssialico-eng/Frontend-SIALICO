import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LabelService } from '../../../core/services/label.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { Label } from '../../../core/models/models';

@Component({
  selector: 'app-admin-label-review',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, StatusBadgeComponent, PrimaryButtonComponent],
  templateUrl: './admin-label-review.component.html',
  styleUrls: ['./admin-label-review.component.css']
})
export class AdminLabelReviewComponent implements OnInit {
  label: Label | null = null;
  isLoading = true;
  isSubmitting = false;
  feedbackFile: File | null = null;
  successMessage = '';
  errorMessage = '';
  reviewForm!: FormGroup;
  decision: 'approved' | 'needs_changes' | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private labelService: LabelService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.reviewForm = this.fb.group({
      feedback: [''],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.labelService.getLabelDetail(+id).subscribe({
        next: (l) => { this.label = l; this.isLoading = false; },
        error: () => { this.isLoading = false; }
      });
    }
  }

  setDecision(decision: 'approved' | 'needs_changes') {
    this.decision = decision;
    if (decision === 'approved') {
      this.reviewForm.get('feedback')?.clearValidators();
    } else {
      this.reviewForm.get('feedback')?.setValidators(Validators.required);
    }
    this.reviewForm.get('feedback')?.updateValueAndValidity();
  }

  onFeedbackFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.feedbackFile = input.files?.[0] || null;
  }

  submitReview() {
    if (!this.label || !this.decision || this.isSubmitting) return;
    if (this.decision === 'needs_changes' && this.reviewForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    this.labelService.reviewLabel(this.label.id, {
      status: this.decision,
      feedback: this.reviewForm.value.feedback || '',
    }).subscribe({
      next: () => {
        // Si hay archivo de retroalimentación, subirlo
        if (this.feedbackFile && this.label) {
          this.labelService.uploadFeedbackFile(this.label.id, this.feedbackFile).subscribe({
            next: () => this.onSuccess(),
            error: () => this.onSuccess() // continuar aunque falle el archivo
          });
        } else {
          this.onSuccess();
        }
      },
      error: () => {
        this.errorMessage = 'No se pudo guardar la revisión. Intenta de nuevo.';
        this.isSubmitting = false;
      }
    });
  }

  onSuccess() {
    this.successMessage = this.decision === 'approved'
      ? 'Etiqueta aprobada correctamente.'
      : 'Cambios solicitados enviados al usuario.';
    this.isSubmitting = false;
    setTimeout(() => this.router.navigate(['/admin/labels']), 1800);
  }

  get canSubmit(): boolean {
    if (!this.decision) return false;
    if (this.decision === 'needs_changes' && !this.reviewForm.value.feedback?.trim()) return false;
    return true;
  }
}