/**
 * SidebarComponent
 *
 * Persistent navigation sidebar for the client dashboard layout.
 * Renders nav links to all main client sections and polls the server
 * every 30 seconds to keep the unread notification badge up to date.
 *
 * Used by: DashboardLayoutComponent.
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { SialicoLogoComponent } from '../sialico-logo/sialico-logo.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, SialicoLogoComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  /** Current count of unread notifications; drives the badge in the nav link. */
  unreadCount = 0;
  /** Holds the polling subscription so it can be cancelled on destroy. */
  private pollSub?: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Poll unread count immediately, then every 30 seconds while the sidebar is mounted.
    this.pollSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.notificationService.getUnreadCount())
    ).subscribe(count => { this.unreadCount = count; });
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  /** Delegates to AuthService which clears the session and redirects to /login. */
  logout() {
    this.authService.logout();
  }
}
