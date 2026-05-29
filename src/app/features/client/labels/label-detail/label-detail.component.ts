/**
 * LabelDetailComponent
 *
 * Shows a single label and its complete version history, sorted from newest
 * to oldest. The label is fetched first, then its versions are loaded
 * sequentially rather than in parallel because the versions endpoint requires
 * the labelId that is confirmed by the label response.
 *
 * Status helper methods (isApproved, needsChanges, isPending) are used by the
 * template to conditionally show action banners and buttons.
 *
 * Route: /projects/:id/products/:productId/labels/:labelId — protected by authGuard.
 * Depends on: LabelService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LabelService } from '../../../../core/services/label.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PrimaryButtonComponent } from '../../../../shared/components/primary-button/primary-button.component';
import { Label, LabelVersion } from '../../../../shared/models/models';

@Component({
  selector: 'app-label-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, PrimaryButtonComponent],
  templateUrl: './label-detail.component.html',
  styleUrls: ['./label-detail.component.css']
})
export class LabelDetailComponent implements OnInit {
  /** The label record; null until the first API call resolves. */
  label:     Label | null   = null;
  /** All versions for this label, sorted descending by version_number (latest first). */
  versions:  LabelVersion[] = [];
  /** True until both the label and its versions have loaded. */
  isLoading  = true;
  /** Route params; projectId and productId are only needed to build navigation URLs. */
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

  /** Fetches all versions and sorts them newest-first for display. */
  loadVersions() {
    this.labelService.getLabelVersions(this.labelId).subscribe({
      next: (versions) => {
        this.versions  = versions.sort((a, b) => b.version_number - a.version_number);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  /** Constructs the back-navigation URL to the parent product detail page. */
  get backRoute(): string {
    return `/projects/${this.projectId}/products/${this.productId}`;
  }

  /** Constructs the route to upload a new label version for this product. */
  get newVersionRoute(): string {
    return `/projects/${this.projectId}/products/${this.productId}/labels/new`;
  }

  /** The most recent version (index 0 after descending sort); null if no versions exist. */
  get latestVersion(): LabelVersion | null {
    return this.versions.length > 0 ? this.versions[0] : null;
  }

  /** Returns true when the label has been approved; drives the success banner in the template. */
  isApproved(): boolean {
    return this.label?.current_status?.toUpperCase() === 'APPROVED';
  }

  /** Returns true when the reviewer has requested changes; drives the changes-required banner. */
  needsChanges(): boolean {
    return this.label?.current_status?.toUpperCase() === 'CHANGES_REQUIRED';
  }

  /** Returns true when the label is awaiting review; drives the pending-review banner. */
  isPending(): boolean {
    const s = this.label?.current_status?.toUpperCase();
    return s === 'SUBMITTED' || s === 'IN_REVIEW';
  }
}
