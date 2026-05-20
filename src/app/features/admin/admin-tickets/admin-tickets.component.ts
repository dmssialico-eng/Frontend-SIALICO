import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Ticket } from '../../../core/models/models';

type TicketTab = 'OPEN' | 'IN_PROGRESS' | 'ANSWERED' | 'ALL';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, EmptyStateComponent],
  templateUrl: './admin-tickets.component.html',
  styleUrls: ['./admin-tickets.component.css']
})
export class AdminTicketsComponent implements OnInit {
  allTickets:      Ticket[] = [];
  filteredTickets: Ticket[] = [];
  activeTab: TicketTab = 'OPEN';
  isLoading = true;

  tabs: { key: TicketTab; label: string }[] = [
    { key: 'OPEN',        label: 'Abiertos' },
    { key: 'IN_PROGRESS', label: 'En proceso' },
    { key: 'ANSWERED',    label: 'Respondidos' },
    { key: 'ALL',         label: 'Todos' },
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getAllTickets().subscribe({
      next: (res: any) => {
        this.allTickets = res.results ?? res;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  setTab(tab: TicketTab) {
    this.activeTab = tab;
    this.applyFilter();
  }

  applyFilter() {
    if (this.activeTab === 'ALL') {
      this.filteredTickets = this.allTickets;
    } else {
      this.filteredTickets = this.allTickets.filter(
        t => t.status?.toUpperCase() === this.activeTab
      );
    }
  }

  tabCount(key: TicketTab): number {
    if (key === 'ALL') return this.allTickets.length;
    return this.allTickets.filter(t => t.status?.toUpperCase() === key).length;
  }
}
