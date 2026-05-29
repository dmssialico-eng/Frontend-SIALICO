/**
 * NotificationsComponent
 *
 * Paginated notification centre with tab-based category filtering.
 * Each tab maps to a `notification_type` query param sent to the backend;
 * the "all" tab sends no filter. Switching tabs resets the scroller so
 * the first page of the new category is fetched cleanly.
 *
 * Clicking a notification marks it as read (if unread) and navigates to the
 * relevant section of the app based on `related_entity` and `notification_type`.
 *
 * Route: /notifications — protected by authGuard.
 * Depends on: NotificationService, InfiniteScroller.
 */
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';
import { InfiniteScroller } from '../../../core/services/pagination.service';
import { Notification } from '../../../shared/models/models';
import { environment } from '../../../../environments/environment';

/** UI tab identifiers that map to backend notification_type values. */
type NotifTab = 'all' | 'projects' | 'regulatory' | 'training' | 'billing';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  /** Manages paginated notification data; recreated on each tab switch to reset state. */
  scroller!: InfiniteScroller<Notification>;
  /** Currently selected tab; determines the notification_type filter. */
  activeTab: NotifTab = 'all';
  loadError = false;

  tabs: { key: NotifTab; label: string }[] = [
    { key: 'all',        label: 'Todas'        },
    { key: 'projects',   label: 'Proyectos'    },
    { key: 'regulatory', label: 'Regulatorio'  },
    { key: 'training',   label: 'Capacitación' },
    { key: 'billing',    label: 'Facturación'  },
  ];

  /** Maps UI tab keys to the notification_type values the API understands.
   *  Tabs without an entry ('all', 'training') send no type filter. */
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

  /** Switches to a new tab and resets the scroller to load the first page of that category. */
  setTab(tab: NotifTab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.initScroller();
  }

  /** Loads the next page when the user scrolls near the bottom; passes the active tab's type filter. */
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

  /**
   * Counts unread notifications in the currently loaded page set.
   * This is a client-side count and does not reflect items on pages not yet fetched.
   */
  get unreadCount(): number {
    return this.scroller?.items.filter(n => !n.is_read).length ?? 0;
  }

  /** Calls the bulk mark-all-as-read API and optimistically sets is_read on all loaded items. */
  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.scroller.items.forEach(n => (n.is_read = true));
      }
    });
  }

  /** Marks the notification read (if needed) then navigates to the relevant app section. */
  handleClick(notif: Notification) {
    if (!notif.is_read) {
      this.notificationService.markAsRead(notif.id).subscribe({
        next: () => { notif.is_read = true; }
      });
    }
    const route = this.resolveRoute(notif);
    if (route) this.router.navigate(route);
  }

  /**
   * Maps a notification's entity type and notification_type to an app route.
   * Returns null for notifications that have no corresponding deep-link.
   * Both fields are checked because the API is not always consistent about
   * which one is populated.
   */
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

  /** Returns true when the notification has a known deep-link destination. */
  hasRoute(notif: Notification): boolean {
    return this.resolveRoute(notif) !== null;
  }
}