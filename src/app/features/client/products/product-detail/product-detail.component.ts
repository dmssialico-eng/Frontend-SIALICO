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
  product:   Product | null = null;
  labels:    Label[]        = [];
  projectId: number | null  = null;
  isLoading  = true;
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

  get uploadRoute(): string {
    return `/projects/${this.projectId}/products/${this.product?.id}/labels/new`;
  }
}