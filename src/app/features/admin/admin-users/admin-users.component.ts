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
  togglingId: number | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getAllUsers().subscribe({
      next: (res: any) => {
        this.users = res.results || res;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  toggleActive(user: AdminUser) {
    this.togglingId = user.id;
    this.adminService.updateUserStatus(user.id, !user.is_active).subscribe({
      next: (updated) => {
        user.is_active = updated.is_active;
        this.togglingId = null;
      },
      error: () => { this.togglingId = null; }
    });
  }
}