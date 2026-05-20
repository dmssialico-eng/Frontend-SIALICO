import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LabelService } from '../../../core/services/label.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Label } from '../../../core/models/models';

type LabelTab = 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUIRED' | 'all';

@Component({
  selector: 'app-admin-labels',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, EmptyStateComponent],
  templateUrl: './admin-labels.component.html',
  styleUrls: ['./admin-labels.component.css']
})
export class AdminLabelsComponent implements OnInit {
  allLabels: Label[] = [];
  filteredLabels: Label[] = [];
  activeTab: LabelTab = 'SUBMITTED';
  isLoading = true;

  tabs: { key: LabelTab; label: string }[] = [
    { key: 'SUBMITTED',        label: 'Pendientes'   },
    { key: 'IN_REVIEW',        label: 'En revisión'  },
    { key: 'APPROVED',         label: 'Aprobadas'    },
    { key: 'CHANGES_REQUIRED', label: 'Con cambios'  },
    { key: 'all',              label: 'Todas'        },
  ];

  constructor(private labelService: LabelService) {}

  ngOnInit() {
    this.loadLabels();
  }

  loadLabels() {
    this.isLoading = true;
    this.labelService.getAllLabels().subscribe({
      next: (res: any) => {
        this.allLabels = res.results ?? res;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  setTab(tab: LabelTab) {
    this.activeTab = tab;
    this.applyFilter();
  }

  applyFilter() {
    if (this.activeTab === 'all') {
      this.filteredLabels = this.allLabels;
    } else {
      this.filteredLabels = this.allLabels.filter(
        l => l.current_status?.toUpperCase() === this.activeTab
      );
    }
  }

  tabCount(key: LabelTab): number {
    if (key === 'all') return this.allLabels.length;
    return this.allLabels.filter(l => l.current_status?.toUpperCase() === key).length;
  }
}
