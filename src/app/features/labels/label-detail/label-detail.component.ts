import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LabelService } from '../../../core/services/label.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { Label } from '../../../core/models/models';

@Component({
  selector: 'app-label-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, PrimaryButtonComponent],
  templateUrl: './label-detail.component.html',
  styleUrls: ['./label-detail.component.css']
})
export class LabelDetailComponent implements OnInit {
  label: Label | null = null;
  isLoading = true;
  projectId!: number;
  productId!: number;

  constructor(
    private route: ActivatedRoute,
    private labelService: LabelService
  ) {}

  ngOnInit() {
    this.projectId = +this.route.snapshot.paramMap.get('id')!;
    this.productId = +this.route.snapshot.paramMap.get('productId')!;
    const labelId   = +this.route.snapshot.paramMap.get('labelId')!;

    this.labelService.getLabelDetail(labelId).subscribe({
      next: (l) => { this.label = l; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get backRoute(): string {
    return `/projects/${this.projectId}/products/${this.productId}`;
  }

  get newVersionRoute(): string {
    return `/projects/${this.projectId}/products/${this.productId}/labels/new`;
  }

  get isPdf(): boolean {
    return this.label?.file_type === 'pdf';
  }

  get statusIcon(): string {
    const icons: Record<string, string> = {
      approved:      '✓',
      needs_changes: '!',
      in_review:     '…',
      submitted:     '→',
      draft:         '○',
    };
    return icons[this.label?.status || ''] || '?';
  }
}