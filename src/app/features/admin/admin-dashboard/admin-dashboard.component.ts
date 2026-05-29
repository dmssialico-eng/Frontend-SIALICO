/**
 * AdminDashboardComponent
 *
 * Overview screen for administrators. Loads platform-wide stats, the 5 most
 * recently submitted labels, and the 5 most recently opened tickets in a
 * single forkJoin. Each stream uses catchError so a partial failure does not
 * block the entire dashboard from rendering.
 *
 * Route: /admin/dashboard — protected by authGuard + roleGuard (ADMIN).
 * Depends on: AdminService, LabelService, AuthService.
 */
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
  /** Platform-wide statistics returned by the admin stats endpoint. */
  stats: AdminDashboardStats | null = null;
  /** Up to 5 most recently submitted labels shown in the pending-review preview list. */
  recentLabels: Label[] = [];
  /** Up to 5 most recently opened support tickets shown in the activity preview list. */
  recentTickets: Ticket[] = [];
  /** Admin's display name, read from in-memory AuthService to avoid an extra HTTP call. */
  adminName = '';
  /** True until the forkJoin resolves. */
  isLoading = true;
  /** True when the overall forkJoin fails (individual streams have their own catchError). */
  loadError = false;

  constructor(
    private adminService: AdminService,
    private labelService: LabelService,
    private authService:  AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.adminName = user?.full_name || 'Admin';

    // Each stream catches its own errors so a single failing endpoint does not
    // prevent the other two from rendering.
    forkJoin({
      stats:         this.adminService.getDashboardStats().pipe(catchError(() => of(null))),
      recentLabels:  this.labelService.getAllLabels('submitted').pipe(catchError(() => of({ results: [] }))),
      recentTickets: this.adminService.getAllTickets('open').pipe(catchError(() => of({ results: [] }))),
    }).subscribe({
      next: (data) => {
        this.stats        = data.stats;
        const labels      = (data.recentLabels as any);
        this.recentLabels = (labels.results || labels).slice(0, 5);
        const tickets     = (data.recentTickets as any);
        this.recentTickets = (tickets.results || tickets).slice(0, 5);
        this.isLoading    = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      }
    });
  }
}