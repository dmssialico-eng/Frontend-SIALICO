/**
 * AdminUsersComponent
 *
 * Lists all registered platform users with their role and active status.
 * Allows the admin to toggle a user's is_active flag, which controls login access.
 * `togglingId` tracks which user's toggle is in flight to disable just that
 * button while the request is pending rather than disabling the entire list.
 *
 * Route: /admin/users — protected by authGuard + roleGuard (ADMIN).
 * Depends on: AdminService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { AdminUser } from '../../../shared/models/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  isLoading = true;
  /** ID of the user whose active-toggle request is currently in flight; null when idle. */
  togglingId: number | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getAllUsers().subscribe({
      next: (res: any) => {
        this.users    = res.results || res;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  /**
   * Flips the user's is_active status on the backend and updates the local
   * record on success so the row reflects the new state without a full reload.
   */
  toggleActive(user: AdminUser) {
    this.togglingId = user.id;
    this.adminService.updateUserStatus(user.id, !user.is_active).subscribe({
      next: (updated) => {
        user.is_active  = updated.is_active;
        this.togglingId = null;
      },
      error: () => { this.togglingId = null; }
    });
  }
}