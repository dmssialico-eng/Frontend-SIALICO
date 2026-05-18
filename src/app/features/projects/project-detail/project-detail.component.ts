import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { ProductService } from '../../../core/services/product.service';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Project, Product } from '../../../core/models/models';

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
  project: Project | null = null;
  products: Product[] = [];
  isLoading = true;
  isCreatingProduct = false;
  showProductForm = false;
  productForm!: FormGroup;
  productError = '';

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private productService: ProductService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.productForm = this.fb.group({
      name:        ['', Validators.required],
      description: [''],
      ingredients: [''],
      claims:      [''],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectService.getProject(+id).subscribe({
        next: (p) => {
          this.project = p;
          this.loadProducts(+id);
        },
        error: () => { this.isLoading = false; }
      });
    }
  }

  loadProducts(projectId: number) {
    this.productService.getProductsByProject(projectId).subscribe({
      next: (res) => {
        this.products = res.results || res;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  submitProduct() {
    if (this.productForm.invalid || this.isCreatingProduct || !this.project) return;
    this.isCreatingProduct = true;
    this.productError = '';

    const payload = {
      ...this.productForm.value,
      project: this.project.id,
      status: 'active',
    };

    this.productService.createProduct(payload).subscribe({
      next: (p) => {
        this.products.unshift(p);
        this.productForm.reset();
        this.showProductForm = false;
        this.isCreatingProduct = false;
      },
      error: () => {
        this.productError = 'No se pudo crear el producto. Intenta de nuevo.';
        this.isCreatingProduct = false;
      }
    });
  }
}