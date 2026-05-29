/**
 * LabelUploadComponent
 *
 * File upload form for submitting a new label version for regulatory review.
 * The submission is a three-step sequential flow orchestrated by LabelService.submitLabelVersion():
 *   1. Upload the document file → obtain a Document ID.
 *   2. Create or reuse an existing Label for this product.
 *   3. Create a LabelVersion that links the document to the label.
 *
 * The `existingLabelId` is pre-fetched on init so the service can skip step 2
 * if a label already exists for this product.
 *
 * `currentStep` tracks progress across the three async phases and drives the
 * progress indicator in the template.
 *
 * Route: /projects/:id/products/:productId/labels/new — protected by authGuard.
 * Depends on: LabelService, ErrorHandlerService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { LabelService } from '../../../../core/services/label.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PrimaryButtonComponent } from '../../../../shared/components/primary-button/primary-button.component';

/** Tracks which phase of the three-step submit flow is currently active. */
type UploadStep = 'idle' | 'uploading-doc' | 'creating-label' | 'creating-version' | 'done';

@Component({
  selector: 'app-label-upload',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PrimaryButtonComponent],
  templateUrl: './label-upload.component.html',
  styleUrls: ['./label-upload.component.css']
})
export class LabelUploadComponent implements OnInit {
  form!: FormGroup;
  /** Parent project ID from the route; used to construct the back/forward navigation links. */
  projectId!: number;
  /** Product ID from the route; the upload is scoped to this product. */
  productId!: number;
  /**
   * ID of an existing Label for this product, pre-fetched on init.
   * Passed to submitLabelVersion() so it skips Label creation when one already exists.
   * Null when no label has been created for this product yet.
   */
  existingLabelId: number | null = null;

  /** The file the user selected or dropped for upload. */
  selectedFile:  File | null   = null;
  /** Data URL for image preview; null for non-image file types. */
  previewUrl:    string | null = null;
  /** True while a file is being dragged over the drop zone. */
  isDragging     = false;
  /** True while any phase of the three-step submission is running. */
  isSubmitting   = false;
  /** Error message shown below the form on any step failure. */
  errorMessage   = '';
  /** Tracks which submission phase is currently active for the progress indicator. */
  currentStep: UploadStep = 'idle';

  /** MIME types accepted by the file input; any other type is rejected client-side. */
  readonly allowedMimes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  readonly MAX_FILE_MB = 10;
  readonly allowedExtensions = 'PDF, PNG, JPG, DOCX, TXT';

  /** Human-readable label shown in the progress indicator for each step. */
  readonly stepLabels: Record<UploadStep, string> = {
    idle:               '',
    'uploading-doc':    'Subiendo archivo...',
    'creating-label':   'Preparando etiqueta...',
    'creating-version': 'Registrando versión...',
    done:               '¡Listo!',
  };

  constructor(
    private route:         ActivatedRoute,
    private router:        Router,
    private labelService:  LabelService,
    private errorHandler:  ErrorHandlerService,
    private fb:            FormBuilder
  ) {}

  ngOnInit() {
    this.projectId = +this.route.snapshot.paramMap.get('id')!;
    this.productId = +this.route.snapshot.paramMap.get('productId')!;

    this.form = this.fb.group({ notes: [''] });

    // Pre-fetch to check if a Label already exists for this product.
    // Non-blocking: if the call fails the backend will create the Label during submission.
    this.labelService.getLabelsByProduct(this.productId).subscribe({
      next: (labels) => {
        if (labels.length > 0) this.existingLabelId = labels[0].id;
      },
      error: () => {}
    });
  }


  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
  }

  /** Validates MIME type and size before accepting a file; generates an image preview when applicable. */
  handleFile(file: File) {
    if (!this.allowedMimes.includes(file.type)) {
      this.errorMessage = `Tipo de archivo no permitido. Formatos aceptados: ${this.allowedExtensions}`;
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'El archivo no puede superar 10 MB.';
      return;
    }
    this.errorMessage = '';
    this.selectedFile = file;

    // Only generate a preview URL for images; PDFs and documents are shown by name only.
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => { this.previewUrl = e.target?.result as string; };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  /** Clears the selected file and any preview so the user can pick a different file. */
  removeFile() {
    this.selectedFile = null;
    this.previewUrl   = null;
    this.errorMessage = '';
  }

  /**
   * Starts the three-step submission by delegating to LabelService.submitLabelVersion().
   * On success, navigates to the newly created label's detail page.
   * `version.label` is the label ID returned by the API.
   */
  submit() {
    if (!this.selectedFile || this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.currentStep  = 'uploading-doc';

    this.labelService.submitLabelVersion({
      productId: this.productId,
      labelId:   this.existingLabelId,
      file:      this.selectedFile,
      notes:     this.form.value.notes ?? '',
    }).subscribe({
      next: (version) => {
        this.currentStep = 'done';
        this.router.navigate([
          '/projects', this.projectId,
          'products',  this.productId,
          'labels',    version.label,
        ]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.currentStep  = 'idle';
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      }
    });
  }

  /** Constructs the back-navigation route to the product detail page. */
  get backRoute(): string {
    return `/projects/${this.projectId}/products/${this.productId}`;
  }

  /** Returns the human-readable label for the current submission step. */
  get stepLabel(): string {
    return this.stepLabels[this.currentStep];
  }

  /** Returns true when the selected file is an image, enabling the preview panel. */
  get isImage(): boolean {
    return !!this.selectedFile?.type.startsWith('image/');
  }

  /** Formats raw byte count into a human-readable string (B / KB / MB). */
  formatSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}