import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { LabelService } from '../../../core/services/label.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { AdminDashboardStats, Label, Ticket } from '../../../shared/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminDashboardStats | null = null;
  recentLabels: Label[] = [];
  recentTickets: Ticket[] = [];
  adminName = '';
  isLoading = true;
  loadError = false;

  constructor(
    private adminService: AdminService,
    private labelService: LabelService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.adminName = user?.full_name || 'Admin';

    forkJoin({
      stats:         this.adminService.getDashboardStats().pipe(catchError(() => of(null))),
      recentLabels:  this.labelService.getAllLabels('submitted').pipe(catchError(() => of({ results: [] }))),
      recentTickets: this.adminService.getAllTickets('open').pipe(catchError(() => of({ results: [] }))),
    }).subscribe({
      next: (data) => {
        this.stats = data.stats;
        const labels = (data.recentLabels as any);
        this.recentLabels = (labels.results || labels).slice(0, 5);
        const tickets = (data.recentTickets as any);
        this.recentTickets = (tickets.results || tickets).slice(0, 5);
        this.isLoading = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      }
    });
  }
}