import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { LabelService } from '../../../core/services/label.service';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';

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
  projectId!: number;
  productId!: number;
  existingLabelId: number | null = null;

  selectedFile:  File | null   = null;
  previewUrl:    string | null = null;
  isDragging     = false;
  isSubmitting   = false;
  errorMessage   = '';
  currentStep: UploadStep = 'idle';

  readonly allowedMimes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  readonly allowedExtensions = 'PDF, PNG, JPG, DOCX, TXT';

  readonly stepLabels: Record<UploadStep, string> = {
    idle:             '',
    'uploading-doc':  'Subiendo archivo...',
    'creating-label': 'Preparando etiqueta...',
    'creating-version': 'Registrando versión...',
    done:             '¡Listo!',
  };

  constructor(
    private route:        ActivatedRoute,
    private router:       Router,
    private labelService: LabelService,
    private fb:           FormBuilder
  ) {}

  ngOnInit() {
    this.projectId = +this.route.snapshot.paramMap.get('id')!;
    this.productId = +this.route.snapshot.paramMap.get('productId')!;

    this.form = this.fb.group({ notes: [''] });

    // Verificar si ya existe una Label para este producto
    this.labelService.getLabelsByProduct(this.productId).subscribe({
      next: (labels) => {
        if (labels.length > 0) {
          this.existingLabelId = labels[0].id;
        }
      },
      error: () => { /* No bloqueante — si falla, el backend crea la Label */ }
    });
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

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

  handleFile(file: File) {
    if (!this.allowedMimes.includes(file.type)) {
      this.errorMessage = `Tipo de archivo no permitido. Formatos aceptados: ${this.allowedExtensions}`;
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      this.errorMessage = 'El archivo no puede superar 20 MB.';
      return;
    }
    this.errorMessage = '';
    this.selectedFile = file;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => { this.previewUrl = e.target?.result as string; };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.previewUrl   = null;
    this.errorMessage = '';
  }

  // ── Envío ────────────────────────────────────────────────────────────────

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
        if (err.status === 403) {
          this.errorMessage = 'Has alcanzado el límite de versiones de etiqueta permitido por tu plan.';
        } else {
          this.errorMessage = 'No se pudo enviar la etiqueta. Intenta de nuevo.';
        }
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  get backRoute(): string {
    return `/projects/${this.projectId}/products/${this.productId}`;
  }

  get stepLabel(): string {
    return this.stepLabels[this.currentStep];
  }

  get isImage(): boolean {
    return !!this.selectedFile?.type.startsWith('image/');
  }

  formatSize(bytes: number): string {
    if (bytes < 1024)          return `${bytes} B`;
    if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
