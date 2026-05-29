/**
 * AdminSidebarComponent
 *
 * Persistent navigation sidebar for the admin layout.
 * Groups nav links by functional area: Labels, Support, Management, and System.
 * The "Panel Admin" badge distinguishes this sidebar from the client sidebar.
 *
 * Used by: AdminLayoutComponent.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SialicoLogoComponent } from '../sialico-logo/sialico-logo.component';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, SialicoLogoComponent],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css']
})
export class AdminSidebarComponent {
  constructor(private authService: AuthService, private router: Router) {}

  /** Clears the session via AuthService and explicitly navigates to /login. */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}