import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/models';

type NotifTab = 'all' | 'projects' | 'regulatory' | 'training' | 'billing';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  allNotifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  activeTab: NotifTab = 'all';
  isLoading = true;

  tabs: { key: NotifTab; label: string }[] = [
    { key: 'all',        label: 'Todas' },
    { key: 'projects',   label: 'Proyectos' },
    { key: 'regulatory', label: 'Regulatorio' },
    { key: 'training',   label: 'Capacitación' },
    { key: 'billing',    label: 'Facturación' },
  ];

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.allNotifications = res.results || res;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  setTab(tab: NotifTab) {
    this.activeTab = tab;
    this.applyFilter();
  }

  applyFilter() {
    if (this.activeTab === 'all') {
      this.filteredNotifications = this.allNotifications;
      return;
    }
    const typeMap: Record<NotifTab, string> = {
      all:        '',
      projects:   'project',
      regulatory: 'label_review',
      training:   'training',
      billing:    'payment',
    };
    const filter = typeMap[this.activeTab];
    this.filteredNotifications = this.allNotifications.filter(n =>
      n.notification_type?.toLowerCase().includes(filter)
    );
  }

  get unreadCount(): number {
    return this.filteredNotifications.filter(n => !n.is_read).length;
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.allNotifications.forEach(n => (n.is_read = true));
        this.applyFilter();
      }
    });
  }

  handleClick(notif: Notification) {
    if (!notif.is_read) {
      this.notificationService.markAsRead(notif.id).subscribe({
        next: () => { notif.is_read = true; }
      });
    }
    const route = this.resolveRoute(notif);
    if (route) this.router.navigate(route);
  }

  /** Returns router commands array for a notification, or null if no route applies. */
  resolveRoute(notif: Notification): any[] | null {
    const entity = (notif.related_entity ?? '').toLowerCase();
    const id     = notif.related_id;
    const type   = (notif.notification_type ?? '').toUpperCase();

    if (entity === 'project'      && id) return ['/projects', id];
    if (entity === 'consultation' || type === 'CONSULTATION') return ['/consultations'];
    if (entity === 'ticket'       || type === 'TICKET')       return ['/support'];
    if (entity === 'payment'      || type === 'PAYMENT' || type === 'LIMIT') return ['/subscription'];
    if (entity === 'label'        || type === 'LABEL_REVIEW') return ['/projects'];

    return null;
  }

  hasRoute(notif: Notification): boolean {
    return this.resolveRoute(notif) !== null;
  }
}
