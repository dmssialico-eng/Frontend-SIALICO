/**
 * AdminLayoutComponent
 *
 * Shell layout for authenticated ADMIN users.
 * Renders the admin-specific sidebar (AdminSidebarComponent) and the shared
 * top user bar around a <router-outlet> content slot.
 * Styles are inlined because this layout has no separate CSS file.
 *
 * Applied to: all routes under /admin/* (see app.routes.ts).
 * Guards: authGuard + roleGuard (expectedRole: 'ADMIN').
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';
import { TopUserBarComponent } from '../../shared/components/top-user-bar/top-user-bar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminSidebarComponent, TopUserBarComponent],
  template: `
    <div class="admin-layout">
      <app-admin-sidebar class="sidebar"></app-admin-sidebar>
      <div class="admin-content">
        <app-top-user-bar></app-top-user-bar>
        <div class="admin-page-content">
          <!-- Dynamic content slot — each admin child route renders its component here. -->
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout { display: flex; height: 100vh; overflow: hidden; background-color: var(--page-bg); }
    .sidebar { width: 250px; flex-shrink: 0; background-color: var(--surface); border-right: 1px solid var(--border); }
    .admin-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
    .admin-page-content { flex: 1; padding: 2rem; }
  `]
})
export class AdminLayoutComponent {}
