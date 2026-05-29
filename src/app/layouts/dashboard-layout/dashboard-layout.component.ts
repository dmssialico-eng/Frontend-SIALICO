/**
 * DashboardLayoutComponent
 *
 * Shell layout for authenticated client and consultant users.
 * Renders the persistent sidebar (SidebarComponent) and the top user bar
 * (TopUserBarComponent) around a <router-outlet> content slot.
 *
 * Applied to: all routes under the client route group (see app.routes.ts).
 * Guard: authGuard.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopUserBarComponent } from '../../shared/components/top-user-bar/top-user-bar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopUserBarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent {}
