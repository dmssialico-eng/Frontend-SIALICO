import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';
import { InfiniteScroller } from '../../../core/services/pagination.service';
import { Notification } from '../../../shared/models/models';
import { environment } from '../../../../environments/environment';

type NotifTab = 'all' | 'projects' | 'regulatory' | 'training' | 'billing';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  scroller!: InfiniteScroller<Notification>;
  activeTab: NotifTab = 'all';
  loadError = false;

  tabs: { key: NotifTab; label: string }[] = [
    { key: 'all',        label: 'Todas'        },
    { key: 'projects',   label: 'Proyectos'    },
    { key: 'regulatory', label: 'Regulatorio'  },
    { key: 'training',   label: 'Capacitación' },
    { key: 'billing',    label: 'Facturación'  },
  ];

  // Mapa de tab → notification_type para filtrar en backend
  private readonly typeMap: Partial<Record<NotifTab, string>> = {
    projects:   'PROJECT',
    regulatory: 'LABEL_REVIEW',
    billing:    'PAYMENT',
  };

  constructor(
    private http:                HttpClient,
    private notificationService: NotificationService,
    private router:              Router
  ) {}

  ngOnInit() {
    this.initScroller();
  }

  ngOnDestroy() {}

  initScroller() {
    const params: Record<string, string> = {};
    const type = this.typeMap[this.activeTab];
    if (type) params['notification_type'] = type;

    this.scroller = new InfiniteScroller<Notification>(
      this.http,
      `${environment.apiUrl}/notifications/`
    );
    this.scroller.loadMore(params);
  }

  setTab(tab: NotifTab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.initScroller();
  }

  @HostListener('window:scroll')
  onScroll() {
    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.scrollHeight - 200;
    if (nearBottom) {
      const params: Record<string, string> = {};
      const type = this.typeMap[this.activeTab];
      if (type) params['notification_type'] = type;
      this.scroller.loadMore(params);
    }
  }

  get unreadCount(): number {
    return this.scroller?.items.filter(n => !n.is_read).length ?? 0;
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.scroller.items.forEach(n => (n.is_read = true));
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