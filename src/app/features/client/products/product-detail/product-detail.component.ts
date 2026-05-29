/**
 * ProductDetailComponent
 *
 * Displays a single product and all labels (regulatory submissions) that have
 * been created for it. Product and labels are loaded in parallel via forkJoin.
 *
 * Both `id` (projectId) and `productId` are read from the route params:
 * projectId is only needed to construct back-navigation and upload routes
 * since the product/label APIs are keyed on productId alone.
 *
 * Route: /projects/:id/products/:productId — protected by authGuard.
 * Depends on: ProductService, LabelService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LabelService } from '../../../../core/services/label.service';
import { ProductService } from '../../../../core/services/product.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PrimaryButtonComponent } from '../../../../shared/components/primary-button/primary-button.component';
import { Product, Label } from '../../../../shared/models/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusBadgeComponent,
    EmptyStateComponent,
    PrimaryButtonComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  /** The loaded product; null until forkJoin resolves. */
  product:   Product | null = null;
  /** All labels created for this product, ordered as returned by the API. */
  labels:    Label[]        = [];
  /** Parent project ID extracted from the route; used for back/upload links only. */
  projectId: number | null  = null;
  /** True while the parallel product+label fetch is in flight. */
  isLoading  = true;
  /** True when either forkJoin call fails. */
  loadError  = false;

  constructor(
    private route:          ActivatedRoute,
    private productService: ProductService,
    private labelService:   LabelService
  ) {}

  ngOnInit() {
    const pid    = this.route.snapshot.paramMap.get('productId');
    const projId = this.route.snapshot.paramMap.get('id');
    this.projectId = projId ? +projId : null;

    if (!pid) {
      this.loadError = true;
      this.isLoading = false;
      return;
    }

    forkJoin({
      product: this.productService.getProduct(+pid),
      labels:  this.labelService.getLabelsByProduct(+pid),
    }).subscribe({
      next: ({ product, labels }) => {
        this.product   = product;
        this.labels    = labels;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      }
    });
  }

  /** Constructs the route to the label upload page for this product. */
  get uploadRoute(): string {
    return `/projects/${this.projectId}/products/${this.product?.id}/labels/new`;
  }
}