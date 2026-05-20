import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
  unreadCount = 0;
  private pollSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.pollSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.notificationService.getUnreadCount())
    ).subscribe(count => { this.unreadCount = count; });
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
