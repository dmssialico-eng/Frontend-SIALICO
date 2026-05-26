import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProjectService } from '../../../../core/services/project.service';
import { ProductService } from '../../../../core/services/product.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PrimaryButtonComponent } from '../../../../shared/components/primary-button/primary-button.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { Project, Product, ProductCategory, Country } from '../../../../shared/models/models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    PrimaryButtonComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {
  project:    Project | null  = null;
  products:   Product[]       = [];
  categories: ProductCategory[] = [];
  countries:  Country[]       = [];

  isLoading         = true;
  loadError         = false;
  isCreatingProduct = false;
  isCatalogLoading  = true;
  showProductForm   = false;
  productForm!: FormGroup;
  productError = '';

  // ── Edición de proyecto ───────────────────────────────────────────────────
  isEditing   = false;
  isSaving    = false;
  editForm!:  FormGroup;
  editError   = '';

  // ── Archivar ─────────────────────────────────────────────────────────────
  showArchiveConfirm = false;
  isArchiving        = false;

  constructor(
    private route:          ActivatedRoute,
    private projectService: ProjectService,
    private productService: ProductService,
    private catalogService: CatalogService,
    private errorHandler:   ErrorHandlerService,
    private fb:             FormBuilder
  ) {}

  ngOnInit() {
    this.productForm = this.fb.group({
      name:           ['', Validators.required],
      description:    [''],
      category:       [null, Validators.required],
      target_country: [null, Validators.required],
      ingredients:    [''],
      claims:         [''],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // Carga paralela: proyecto + catálogos
    forkJoin({
      project:    this.projectService.getProject(+id),
      categories: this.catalogService.getCategories(),
      countries:  this.catalogService.getCountries(),
    }).subscribe({
      next: ({ project, categories, countries }) => {
        this.project    = project;
        this.categories = categories;
        this.countries  = countries;
        this.isCatalogLoading = false;

        this.editForm = this.fb.group({
          name:        [project.name,        Validators.required],
          description: [project.description, ''],
        });

        this.loadProducts(+id);
      },
      error: () => {
        this.loadError        = true;
        this.isLoading        = false;
        this.isCatalogLoading = false;
      }
    });
  }

  loadProducts(projectId: number) {
    this.productService.getProductsByProject(projectId).subscribe({
      next: (res) => {
        this.products  = res.results ?? res;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  // ── Crear producto ────────────────────────────────────────────────────────

  submitProduct() {
    if (this.productForm.invalid || this.isCreatingProduct || !this.project) return;
    this.isCreatingProduct = true;
    this.productError      = '';

    const payload = {
      ...this.productForm.value,
      project: this.project.id,
      status:  'DRAFT',
    };

    this.productService.createProduct(payload).subscribe({
      next: (p) => {
        this.products.unshift(p);
        this.productForm.reset();
        this.showProductForm   = false;
        this.isCreatingProduct = false;
      },
      error: (err) => {
        this.productError = this.errorHandler.getErrorMessage(err);
        this.isCreatingProduct = false;
      }
    });
  }

  // ── Editar proyecto ───────────────────────────────────────────────────────

  saveProject() {
    if (!this.editForm.valid || this.isSaving || !this.project) return;
    this.isSaving = true;
    this.editError = '';

    this.projectService.updateProject(this.project.id, this.editForm.value).subscribe({
      next: (updated) => {
        this.project  = updated;
        this.isEditing = false;
        this.isSaving  = false;
      },
      error: (err) => {
        this.editError = this.errorHandler.getErrorMessage(err);
        this.isSaving  = false;
      }
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editError = '';
    if (this.project) {
      this.editForm.patchValue({
        name:        this.project.name,
        description: this.project.description,
      });
    }
  }

  // ── Archivar proyecto ────────────────────────────────────────────────────

  archiveProject() {
    if (!this.project || this.isArchiving) return;
    this.isArchiving = true;

    this.projectService.deleteProject(this.project.id).subscribe({
      next: () => {
        if (this.project) this.project = { ...this.project, status: 'ARCHIVED' };
        this.showArchiveConfirm = false;
        this.isArchiving        = false;
      },
      error: () => { this.isArchiving = false; }
    });
  }
}
