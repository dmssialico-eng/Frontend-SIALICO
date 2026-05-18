import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LabelService } from '../../../core/services/label.service';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';

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
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isSubmitting = false;
  errorMessage = '';
  isDragging = false;

  readonly allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  readonly allowedLabel = 'PDF, PNG, JPG';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private labelService: LabelService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.projectId = +this.route.snapshot.paramMap.get('id')!;
    this.productId = +this.route.snapshot.paramMap.get('productId')!;

    this.form = this.fb.group({
      notes: [''],
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

  handleFile(file: File) {
    if (!this.allowedTypes.includes(file.type)) {
      this.errorMessage = `Tipo de archivo no permitido. Usa: ${this.allowedLabel}`;
      return;
    }
    this.errorMessage = '';
    this.selectedFile = file;

    // Preview para imágenes
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
    this.previewUrl = null;
  }

  submit() {
    if (!this.selectedFile || this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('product', this.productId.toString());
    formData.append('label_file', this.selectedFile);
    formData.append('status', 'submitted');
    if (this.form.value.notes) {
      formData.append('notes', this.form.value.notes);
    }

    this.labelService.uploadLabel(formData).subscribe({
      next: (label) => {
        this.router.navigate([
          '/projects', this.projectId,
          'products', this.productId,
          'labels', label.id
        ]);
      },
      error: () => {
        this.errorMessage = 'No se pudo enviar la etiqueta. Intenta de nuevo.';
        this.isSubmitting = false;
      }
    });
  }

  get backRoute(): string {
    return `/projects/${this.projectId}/products/${this.productId}`;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}