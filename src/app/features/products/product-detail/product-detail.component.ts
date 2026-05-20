import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LabelService } from '../../../core/services/label.service';
import { ProductService } from '../../../core/services/product.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { Product, Label } from '../../../core/models/models';

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

  constructor(
    private route:          ActivatedRoute,
    private productService: ProductService,
    private labelService:   LabelService
  ) {}

  ngOnInit() {
    const pid    = this.route.snapshot.paramMap.get('productId');
    const projId = this.route.snapshot.paramMap.get('id');
    this.projectId = projId ? +projId : null;

    if (pid) {
      this.productService.getProductsByProject(this.projectId!).subscribe({
        next: (res) => {
          const all: Product[] = res.results ?? res;
          this.product = all.find(p => p.id === +pid) ?? null;
        }
      });

      this.labelService.getLabelsByProduct(+pid).subscribe({
        next: (labels) => {
          this.labels    = labels;
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; }
      });
    }
  }

  get uploadRoute(): string {
    return `/projects/${this.projectId}/products/${this.product?.id}/labels/new`;
  }
}
