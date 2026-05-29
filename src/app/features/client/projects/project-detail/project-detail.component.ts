/**
 * ProjectDetailComponent
 *
 * Displays a single project with its nested product list. Supports:
 *   - Inline editing of the project's name and description.
 *   - Soft-archiving the project (sets status to ARCHIVED).
 *   - Adding new products via a collapsible inline form.
 *   - Filtering products by status and category without reloading the project.
 *
 * The initial load uses forkJoin to fetch the project, category catalog, and
 * country catalog in parallel, then calls loadProducts() once all three resolve.
 *
 * Route: /projects/:id — protected by authGuard.
 * Depends on: ProjectService, ProductService, CatalogService, ErrorHandlerService.
 */
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
  /** The loaded project record; null until the initial forkJoin resolves. */
  project:    Project | null    = null;
  /** Products belonging to this project, filtered by the current filterStatus/filterCategory. */
  products:   Product[]         = [];
  /** Product category options for the "Add Product" form dropdown. */
  categories: ProductCategory[] = [];
  /** Country options for the "target_country" field of new products. */
  countries:  Country[]         = [];

  /** True until the initial forkJoin (project + catalogs) has resolved. */
  isLoading         = true;
  /** True when the forkJoin fails; signals a load error state to the template. */
  loadError         = false;
  /** True while the "Add Product" POST is in flight. */
  isCreatingProduct = false;
  /** True until catalog data (categories, countries) has resolved from forkJoin. */
  isCatalogLoading  = true;
  /** Controls visibility of the inline "Add Product" form panel. */
  showProductForm   = false;
  productForm!: FormGroup;
  /** Error message shown beneath the "Add Product" form on failure. */
  productError = '';

  // ── Product filters ───────────────────────────────────────────────────────
  filterStatus:   string = '';
  filterCategory: string = '';
  /** True while a filtered product reload is in flight; dims the list without clearing it. */
  isFilteringProducts = false;

  /** Status filter options; empty string means "no filter applied". */
  readonly statusOptions = [
    { value: '',                 label: 'Todos los estados'  },
    { value: 'DRAFT',            label: 'Borrador'           },
    { value: 'IN_REVIEW',        label: 'En revisión'        },
    { value: 'APPROVED',         label: 'Aprobado'           },
    { value: 'CHANGES_REQUIRED', label: 'Cambios requeridos' },
  ];

  // ── Inline project editing ────────────────────────────────────────────────
  /** Controls visibility of the inline project name/description edit form. */
  isEditing  = false;
  /** True while the PATCH request to update the project is in flight. */
  isSaving   = false;
  editForm!: FormGroup;
  /** Error message shown inside the edit form on PATCH failure. */
  editError  = '';

  // ── Archive ───────────────────────────────────────────────────────────────
  /** Controls visibility of the archive confirmation modal. */
  showArchiveConfirm = false;
  /** True while the archive (soft-delete) request is in flight. */
  isArchiving        = false;

  /** Extracted once from the route and reused for all subsequent API calls. */
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

  /** Fetches products for this project, passing current filter values to the API. */
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

  /** Re-fetches products with the current filter values applied. */
  applyFilter() { this.loadProducts(); }

  /** Resets both filter fields and reloads the full unfiltered product list. */
  clearFilters() {
    this.filterStatus   = '';
    this.filterCategory = '';
    this.loadProducts();
  }

  /** Returns true when at least one filter is set; used to show the "clear" button. */
  get hasActiveFilters(): boolean {
    return !!this.filterStatus || !!this.filterCategory;
  }

  // ── Create product ────────────────────────────────────────────────────────

  /**
   * Posts a new product linked to this project with status DRAFT.
   * Prepends the created product to the local list so the user sees it
   * immediately without a full reload.
   */
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
        this.productError      = this.errorHandler.getErrorMessage(err);
        this.isCreatingProduct = false;
      }
    });
  }

  // ── Edit project ──────────────────────────────────────────────────────────

  /** Sends a PATCH with the edited name/description and updates the local project record on success. */
  saveProject() {
    if (!this.editForm.valid || this.isSaving || !this.project) return;
    this.isSaving  = true;
    this.editError = '';

    this.projectService.updateProject(this.project.id, this.editForm.value).subscribe({
      next: (updated) => { this.project = updated; this.isEditing = false; this.isSaving = false; },
      error: (err)    => { this.editError = this.errorHandler.getErrorMessage(err); this.isSaving = false; }
    });
  }

  /** Discards unsaved changes and restores the edit form to the current project values. */
  cancelEdit() {
    this.isEditing = false;
    this.editError = '';
    if (this.project) this.editForm.patchValue({ name: this.project.name, description: this.project.description });
  }

  // ── Archive ───────────────────────────────────────────────────────────────

  /**
   * Soft-deletes the project by calling deleteProject, which sets its status
   * to ARCHIVED on the backend. Updates the local record so the badge
   * changes immediately without a page reload.
   */
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