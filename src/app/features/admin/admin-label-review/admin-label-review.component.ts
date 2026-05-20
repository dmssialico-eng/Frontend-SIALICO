import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LabelService } from '../../../core/services/label.service';
import { ReviewService } from '../../../core/services/review.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { Label, LabelVersion, LabelReview } from '../../../core/models/models';
import { switchMap, of } from 'rxjs';

type Decision = 'APPROVED' | 'CHANGES_REQUIRED' | null;
type AttachmentType = 'OBSERVATION_DOC' | 'MARKED_LABEL' | 'REFERENCE_IMAGE';

@Component({
  selector: 'app-admin-label-review',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule, StatusBadgeComponent, PrimaryButtonComponent],
  templateUrl: './admin-label-review.component.html',
  styleUrls: ['./admin-label-review.component.css']
})
export class AdminLabelReviewComponent implements OnInit {
  label:          Label | null        = null;
  versions:       LabelVersion[]      = [];
  targetVersion:  LabelVersion | null = null;
  existingReview: LabelReview | null  = null;
  reviewId:       number | null       = null;

  isLoading    = true;
  isSubmitting = false;
  successMessage = '';
  errorMessage   = '';

  reviewForm!: FormGroup;
  decision: Decision = null;
  attachmentFile: File | null = null;
  attachmentType: AttachmentType = 'OBSERVATION_DOC';

  readonly attachmentTypes: { value: AttachmentType; label: string }[] = [
    { value: 'OBSERVATION_DOC',  label: 'Documento de observaciones' },
    { value: 'MARKED_LABEL',     label: 'Etiqueta marcada' },
    { value: 'REFERENCE_IMAGE',  label: 'Imagen de referencia' },
  ];

  constructor(
    private route:         ActivatedRoute,
    private router:        Router,
    private labelService:  LabelService,
    private reviewService: ReviewService,
    private fb:            FormBuilder
  ) {}

  ngOnInit() {
    this.reviewForm = this.fb.group({
      summary:      [''],
      observations: [''],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // 1. Cargar el Label
    this.labelService.getLabelDetail(+id).pipe(
      switchMap(label => {
        this.label = label;
        // 2. Cargar versiones y tomar la más reciente con SUBMITTED
        return this.labelService.getLabelVersions(label.id);
      }),
      switchMap(versions => {
        this.versions = versions.sort((a, b) => b.version_number - a.version_number);
        this.targetVersion = versions.find(
          v => v.status?.toUpperCase() === 'SUBMITTED' || v.status?.toUpperCase() === 'IN_REVIEW'
        ) ?? versions[0] ?? null;

        if (!this.targetVersion) {
          this.isLoading = false;
          return of([]);
        }
        // 3. Cargar revisiones existentes para esta versión
        return this.reviewService.getReviews(this.targetVersion.id);
      })
    ).subscribe({
      next: (reviews: any) => {
        if (Array.isArray(reviews) && reviews.length > 0) {
          this.existingReview = reviews[0];
          this.reviewId = reviews[0].id;
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  setDecision(d: Decision) {
    this.decision = d;
    const obsCtrl = this.reviewForm.get('observations')!;
    if (d === 'CHANGES_REQUIRED') {
      obsCtrl.setValidators(Validators.required);
    } else {
      obsCtrl.clearValidators();
    }
    obsCtrl.updateValueAndValidity();
  }

  onAttachmentFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.attachmentFile = input.files?.[0] ?? null;
  }

  submitReview() {
    if (!this.targetVersion || !this.decision || this.isSubmitting) return;
    if (this.decision === 'CHANGES_REQUIRED' && this.reviewForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      status:       this.decision,
      summary:      this.reviewForm.value.summary ?? '',
      observations: this.reviewForm.value.observations ?? '',
    };

    // Si no existe revisión: crearla primero
    const review$ = this.reviewId
      ? of({ id: this.reviewId } as LabelReview)
      : this.reviewService.createReview(this.targetVersion.id);

    review$.pipe(
      switchMap(review => {
        this.reviewId = review.id;
        return this.reviewService.completeReview(review.id, payload);
      }),
      switchMap(() => {
        if (this.attachmentFile && this.reviewId) {
          return this.reviewService.uploadAttachment(
            this.reviewId,
            this.attachmentFile,
            this.attachmentType
          );
        }
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.successMessage = this.decision === 'APPROVED'
          ? 'Etiqueta aprobada correctamente.'
          : 'Cambios solicitados enviados al cliente.';
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/admin/labels']), 1800);
      },
      error: () => {
        this.errorMessage = 'No se pudo guardar la revisión. Intenta de nuevo.';
        this.isSubmitting = false;
      }
    });
  }

  get canSubmit(): boolean {
    if (!this.decision || !this.targetVersion) return false;
    if (this.decision === 'CHANGES_REQUIRED' && !this.reviewForm.value.observations?.trim()) return false;
    return true;
  }
}
