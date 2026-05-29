/**
 * AdminLabelReviewComponent
 *
 * Admin screen for reviewing a label submission. The initialization sequence is:
 *   1. Load the Label by ID.
 *   2. Load all versions; select the target version (first SUBMITTED or IN_REVIEW,
 *      falling back to the most recent version).
 *   3. Load any existing review for the target version.
 *
 * This three-step chain uses switchMap to keep the logic sequential while keeping
 * it within a single observable subscription.
 *
 * Submission flow:
 *   - If no review record exists yet → create one first (POST), then complete it (PATCH).
 *   - If a review already exists → skip creation and go straight to complete.
 *   - If an attachment file is provided → upload it after the review is completed.
 *
 * CHANGES_REQUIRED decisions make the observations field mandatory.
 *
 * Route: /admin/labels/:id/review — protected by authGuard + roleGuard (ADMIN).
 * Depends on: LabelService, ReviewService, ErrorHandlerService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LabelService } from '../../../core/services/label.service';
import { ReviewService } from '../../../core/services/review.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { Label, LabelVersion, LabelReview } from '../../../shared/models/models';
import { switchMap, of } from 'rxjs';

/** The admin's verdict on the label version being reviewed. */
type Decision = 'APPROVED' | 'CHANGES_REQUIRED' | null;
/** File type classification for optional supporting attachments. */
type AttachmentType = 'OBSERVATION_DOC' | 'MARKED_LABEL' | 'REFERENCE_IMAGE';

@Component({
  selector: 'app-admin-label-review',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule, StatusBadgeComponent, PrimaryButtonComponent],
  templateUrl: './admin-label-review.component.html',
  styleUrls: ['./admin-label-review.component.css']
})
export class AdminLabelReviewComponent implements OnInit {
  /** The parent label record. */
  label:          Label | null        = null;
  /** All versions for this label, sorted newest-first. */
  versions:       LabelVersion[]      = [];
  /** The specific version being reviewed (first SUBMITTED/IN_REVIEW, or latest as fallback). */
  targetVersion:  LabelVersion | null = null;
  /** A pre-existing review record for this version, if one was already created. */
  existingReview: LabelReview | null  = null;
  /** ID of the review record; set either from existingReview or after creating a new one. */
  reviewId:       number | null       = null;

  /** True until the three-step init sequence completes. */
  isLoading    = true;
  /** True while the submit pipeline (create/complete review + optional attachment) is running. */
  isSubmitting = false;
  /** Success message shown for 1.8 s before redirecting back to the labels list. */
  successMessage = '';
  errorMessage   = '';

  reviewForm!: FormGroup;
  /** The admin's verdict; null until a decision button is clicked. */
  decision: Decision = null;
  /** Optional file to attach to the review as supporting documentation. */
  attachmentFile: File | null = null;
  /** Classification of the attachment file; defaults to OBSERVATION_DOC. */
  attachmentType: AttachmentType = 'OBSERVATION_DOC';

  readonly attachmentTypes: { value: AttachmentType; label: string }[] = [
    { value: 'OBSERVATION_DOC', label: 'Documento de observaciones' },
    { value: 'MARKED_LABEL',    label: 'Etiqueta marcada'           },
    { value: 'REFERENCE_IMAGE', label: 'Imagen de referencia'       },
  ];
  
  constructor(
    private route:         ActivatedRoute,
    private router:        Router,
    private labelService:  LabelService,
    private reviewService: ReviewService,
    private fb:            FormBuilder,
    private errorHandler:  ErrorHandlerService
  ) {}

  ngOnInit() {
    this.reviewForm = this.fb.group({
      summary:      [''],
      observations: [''],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // Step 1: load the label record.
    this.labelService.getLabelDetail(+id).pipe(
      switchMap(label => {
        this.label = label;
        // Step 2: load all versions and identify the one to review.
        return this.labelService.getLabelVersions(label.id);
      }),
      switchMap(versions => {
        this.versions      = versions.sort((a, b) => b.version_number - a.version_number);
        this.targetVersion = versions.find(
          v => v.status?.toUpperCase() === 'SUBMITTED' || v.status?.toUpperCase() === 'IN_REVIEW'
        ) ?? versions[0] ?? null;

        if (!this.targetVersion) {
          this.isLoading = false;
          return of([]);
        }
        // Step 3: load any existing review for this version.
        return this.reviewService.getReviews(this.targetVersion.id);
      })
    ).subscribe({
      next: (reviews: any) => {
        if (Array.isArray(reviews) && reviews.length > 0) {
          this.existingReview = reviews[0];
          this.reviewId       = reviews[0].id;
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  /**
   * Sets the admin's decision and dynamically adds/removes the required validator
   * on the observations field — observations are mandatory only for CHANGES_REQUIRED.
   */
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

  /**
   * Submits the review through a sequential switchMap pipeline:
   *   1. Create the review record if it does not yet exist.
   *   2. Complete the review with the admin's decision and notes.
   *   3. Upload the attachment if one was selected.
   * Redirects to /admin/labels after a brief success message delay.
   */
  submitReview() {
    if (!this.targetVersion || !this.decision || this.isSubmitting) return;
    if (this.decision === 'CHANGES_REQUIRED' && this.reviewForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      status:       this.decision,
      summary:      this.reviewForm.value.summary      ?? '',
      observations: this.reviewForm.value.observations ?? '',
    };

    // Reuse the existing review record if one was found during init; otherwise create a new one.
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
          return this.reviewService.uploadAttachment(this.reviewId, this.attachmentFile, this.attachmentType);
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
      error: (err) => {
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        this.isSubmitting = false;
      }
    });
  }

  /** Returns true only when the form is in a state where submission is valid. */
  get canSubmit(): boolean {
    if (!this.decision || !this.targetVersion) return false;
    if (this.decision === 'CHANGES_REQUIRED' && !this.reviewForm.value.observations?.trim()) return false;
    return true;
  }
}
