/**
 * AdminTicketsComponent
 *
 * Admin view of all support tickets across all clients. All tickets are loaded
 * in a single request and then filtered client-side when tabs are switched.
 * This avoids extra API calls when the user browses between tabs and keeps the
 * tabCount badges accurate without additional round trips.
 *
 * Route: /admin/tickets — protected by authGuard + roleGuard (ADMIN).
 * Depends on: AdminService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Ticket } from '../../../shared/models/models';

/** Tab identifiers; ALL shows every ticket regardless of status. */
type TicketTab = 'OPEN' | 'IN_PROGRESS' | 'ANSWERED' | 'ALL';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, EmptyStateComponent],
  templateUrl: './admin-tickets.component.html',
  styleUrls: ['./admin-tickets.component.css']
})
export class AdminTicketsComponent implements OnInit {
  /** Complete ticket list fetched once on init; never modified after load. */
  allTickets:      Ticket[] = [];
  /** Subset of allTickets matching the active tab; recalculated on tab switch. */
  filteredTickets: Ticket[] = [];
  /** Currently selected status tab. */
  activeTab: TicketTab = 'OPEN';
  isLoading = true;

  tabs: { key: TicketTab; label: string }[] = [
    { key: 'OPEN',        label: 'Abiertos'    },
    { key: 'IN_PROGRESS', label: 'En proceso'  },
    { key: 'ANSWERED',    label: 'Respondidos' },
    { key: 'ALL',         label: 'Todos'       },
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

  /** Switches to the given tab and re-filters the already-loaded allTickets list. */
  setTab(tab: TicketTab) {
    this.activeTab = tab;
    this.applyFilter();
  }

  /** Updates filteredTickets based on the current activeTab. */
  applyFilter() {
    if (this.activeTab === 'ALL') {
      this.filteredTickets = this.allTickets;
    } else {
      this.filteredTickets = this.allTickets.filter(
        t => t.status?.toUpperCase() === this.activeTab
      );
    }
  }

  /** Returns the count of tickets matching a tab key; used to render badge counts. */
  tabCount(key: TicketTab): number {
    if (key === 'ALL') return this.allTickets.length;
    return this.allTickets.filter(t => t.status?.toUpperCase() === key).length;
  }
}
