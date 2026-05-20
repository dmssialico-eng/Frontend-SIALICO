import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LabelService } from '../../../core/services/label.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { Label, LabelVersion } from '../../../core/models/models';

@Component({
  selector: 'app-label-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, PrimaryButtonComponent],
  templateUrl: './label-detail.component.html',
  styleUrls: ['./label-detail.component.css']
})
export class LabelDetailComponent implements OnInit {
  label:     Label | null       = null;
  versions:  LabelVersion[]     = [];
  isLoading  = true;
  projectId!: number;
  productId!: number;
  labelId!:   number;

  constructor(
    private route:        ActivatedRoute,
    private labelService: LabelService
  ) {}

  ngOnInit() {
    this.projectId = +this.route.snapshot.paramMap.get('id')!;
    this.productId = +this.route.snapshot.paramMap.get('productId')!;
    this.labelId   = +this.route.snapshot.paramMap.get('labelId')!;

    this.labelService.getLabelDetail(this.labelId).subscribe({
      next: (label) => {
        this.label = label;
        this.loadVersions();
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadVersions() {
    this.labelService.getLabelVersions(this.labelId).subscribe({
      next: (versions) => {
        this.versions  = versions.sort((a, b) => b.version_number - a.version_number);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get backRoute(): string {
    return `/projects/${this.projectId}/products/${this.productId}`;
  }

  get newVersionRoute(): string {
    return `/projects/${this.projectId}/products/${this.productId}/labels/new`;
  }

  get latestVersion(): LabelVersion | null {
    return this.versions.length > 0 ? this.versions[0] : null;
  }

  isApproved(): boolean {
    return this.label?.current_status?.toUpperCase() === 'APPROVED';
  }

  needsChanges(): boolean {
    return this.label?.current_status?.toUpperCase() === 'CHANGES_REQUIRED';
  }

  isPending(): boolean {
    const s = this.label?.current_status?.toUpperCase();
    return s === 'SUBMITTED' || s === 'IN_REVIEW';
  }
}
