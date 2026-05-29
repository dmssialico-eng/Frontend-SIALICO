/**
 * AdminLabelsComponent
 *
 * Admin view of all labels across all clients, organized by review status.
 * Switching tabs triggers a fresh API call with the selected status as a filter.
 * Defaults to the SUBMITTED tab so administrators see the labels awaiting attention first.
 *
 * Route: /admin/labels — protected by authGuard + roleGuard (ADMIN).
 * Depends on: LabelService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LabelService } from '../../../core/services/label.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Label } from '../../../shared/models/models';

/** Tab identifiers mapping to the label status values used as API filter params. */
type LabelTab = 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUIRED' | 'all';

@Component({
  selector: 'app-admin-labels',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, EmptyStateComponent],
  templateUrl: './admin-labels.component.html',
  styleUrls: ['./admin-labels.component.css']
})
export class AdminLabelsComponent implements OnInit {
  labels: Label[] = [];
  /** Currently active status filter tab. */
  activeTab: LabelTab = 'SUBMITTED';
  isLoading = true;

  tabs: { key: LabelTab; label: string }[] = [
    { key: 'SUBMITTED',        label: 'Pendientes'  },
    { key: 'IN_REVIEW',        label: 'En revisión' },
    { key: 'APPROVED',         label: 'Aprobadas'   },
    { key: 'CHANGES_REQUIRED', label: 'Con cambios' },
    { key: 'all',              label: 'Todas'       },
  ];

  constructor(private labelService: LabelService) {}

  ngOnInit() {
    this.loadLabels();
  }

  /** Fetches labels filtered by the active tab's status; clears the list before each load. */
  loadLabels() {
    this.isLoading = true;
    this.labels    = [];
    this.labelService.getAllLabels(this.activeTab).subscribe({
      next: (res: any) => {
        this.labels    = res.results ?? res;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  /** Switches to the given tab and reloads the label list with the new filter. */
  setTab(tab: LabelTab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.loadLabels();
  }
}