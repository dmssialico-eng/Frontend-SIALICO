import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LabelService } from '../../../core/services/label.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Label } from '../../../shared/models/models';

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

  loadLabels() {
    this.isLoading = true;
    this.labels = [];
    this.labelService.getAllLabels(this.activeTab).subscribe({
      next: (res: any) => {
        this.labels    = res.results ?? res;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  setTab(tab: LabelTab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.loadLabels();
  }
}