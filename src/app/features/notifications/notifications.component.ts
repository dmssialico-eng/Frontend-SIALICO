import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(private notificationService: NotificationService) {}

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
      error: () => {
        this.isLoading = false;
      }
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
    // El backend devuelve notification_type como string. Filtramos por prefijo/contenido.
    const typeMap: Record<NotifTab, string> = {
      all:        '',
      projects:   'project',
      regulatory: 'regulatory',
      training:   'training',
      billing:    'billing',
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

  markAsRead(id: number) {
    const notif = this.allNotifications.find(n => n.id === id);
    if (notif && !notif.is_read) {
      this.notificationService.markAsRead(id).subscribe({
        next: () => { notif.is_read = true; }
      });
    }
  }
}