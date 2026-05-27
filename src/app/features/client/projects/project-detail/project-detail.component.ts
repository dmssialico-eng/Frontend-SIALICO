import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ProjectService } from '../../../../core/services/project.service';
import { ProductService } from '../../../../core/services/product.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PrimaryButtonComponent } from '../../../../shared/components/primary-button/primary-button.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { Project, Product, ProductCategory, Country } from '../../../../shared/models/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, FormsModule,
    PrimaryButtonComponent, StatusBadgeComponent, EmptyStateComponent,
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {
  project:    Project | null    = null;
  products:   Product[]         = [];
  categories: ProductCategory[] = [];
  countries:  Country[]         = [];

  isLoading         = true;
  loadError         = false;
  isCreatingProduct = false;
  isCatalogLoading  = true;
  showProductForm   = false;
  productForm!: FormGroup;
  productError = '';

  // ── Filtros de productos ──────────────────────────────────────────────────
  filterStatus:   string = '';
  filterCategory: string = '';
  isFilteringProducts = false;

  readonly statusOptions = [
    { value: '',                 label: 'Todos los estados'  },
    { value: 'DRAFT',            label: 'Borrador'           },
    { value: 'IN_REVIEW',        label: 'En revisión'        },
    { value: 'APPROVED',         label: 'Aprobado'           },
    { value: 'CHANGES_REQUIRED', label: 'Cambios requeridos' },
  ];

  // ── Edición ───────────────────────────────────────────────────────────────
  isEditing  = false;
  isSaving   = false;
  editForm!: FormGroup;
  editError  = '';

  // ── Archivar ──────────────────────────────────────────────────────────────
  showArchiveConfirm = false;
  isArchiving        = false;

  private projectId!: number;

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
    this.projectId = +id;

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

        this.loadProducts();
      },
      error: () => {
        this.loadError        = true;
        this.isLoading        = false;
        this.isCatalogLoading = false;
      }
    });
  }

  loadProducts() {
    this.isFilteringProducts = true;
    this.productService.getProductsByProject(
      this.projectId,
      { status: this.filterStatus, category: this.filterCategory }
    ).subscribe({
      next: (res) => {
        this.products            = res.results ?? res;
        this.isLoading           = false;
        this.isFilteringProducts = false;
      },
      error: () => {
        this.isLoading           = false;
        this.isFilteringProducts = false;
      }
    });
  }

  applyFilter() { this.loadProducts(); }

  clearFilters() {
    this.filterStatus   = '';
    this.filterCategory = '';
    this.loadProducts();
  }

  get hasActiveFilters(): boolean {
    return !!this.filterStatus || !!this.filterCategory;
  }

  // ── Crear producto ────────────────────────────────────────────────────────
  submitProduct() {
    if (this.productForm.invalid || this.isCreatingProduct || !this.project) return;
    this.isCreatingProduct = true;
    this.productError      = '';

    const payload = { ...this.productForm.value, project: this.project.id, status: 'DRAFT' };

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
      next: (updated) => { this.project = updated; this.isEditing = false; this.isSaving = false; },
      error: (err) => { this.editError = this.errorHandler.getErrorMessage(err); this.isSaving = false; }
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editError = '';
    if (this.project) this.editForm.patchValue({ name: this.project.name, description: this.project.description });
  }

  // ── Archivar ──────────────────────────────────────────────────────────────
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