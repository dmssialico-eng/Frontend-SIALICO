/**
 * AdminTicketDetailComponent
 *
 * Shows the full conversation thread for a support ticket and allows the admin
 * to send messages and change the ticket's status. The ticket and its messages
 * are loaded sequentially because the messages endpoint requires the ticket ID
 * confirmed by the first call.
 *
 * `currentUserId` is passed to TicketThreadComponent to right-align admin messages
 * in the chat bubble layout.
 *
 * Route: /admin/tickets/:id — protected by authGuard + roleGuard (ADMIN).
 * Depends on: TicketService, AdminService, AuthService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketService } from '../../../core/services/ticket.service';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { TicketThreadComponent } from '../../../shared/components/ticket-thread/ticket-thread.component';
import { Ticket, TicketMessage } from '../../../shared/models/models';

@Component({
  selector: 'app-admin-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, TicketThreadComponent],
  templateUrl: './admin-ticket-detail.component.html',
  styleUrls: ['./admin-ticket-detail.component.css']
})
export class AdminTicketDetailComponent implements OnInit {
  /** The loaded ticket record; null until the first API call resolves. */
  ticket:    Ticket | null   = null;
  /** All messages in the conversation thread. */
  messages:  TicketMessage[] = [];
  /** True until both the ticket and its messages have loaded. */
  isLoading  = true;
  /** True while a message send POST is in flight. */
  isSending  = false;
  /** The logged-in admin's ID; passed to TicketThreadComponent for bubble alignment. */
  currentUserId: number | null = null;

  /** Status options shown in the status-change dropdown. */
  statusOptions = [
    { value: 'OPEN',        label: 'Abierto'    },
    { value: 'IN_PROGRESS', label: 'En proceso' },
    { value: 'ANSWERED',    label: 'Respondido' },
    { value: 'CLOSED',      label: 'Cerrado'    },
  ];

  constructor(
    private route:       ActivatedRoute,
    private ticketService: TicketService,
    private adminService:  AdminService,
    private authService:   AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id ?? null;

    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadTicket(+id);
  }

  loadTicket(id: number) {
    this.ticketService.getTicketById(id).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.loadMessages(id);
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadMessages(ticketId: number) {
    this.ticketService.getTicketMessages(ticketId).subscribe({
      next: (res: any) => {
        this.messages = res.results ?? res;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSendMessage(text: string) {
    if (!this.ticket) return;
    this.isSending = true;
    this.ticketService.createTicketMessage(this.ticket.id, text).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.isSending = false;
      },
      error: () => { this.isSending = false; }
    });
  }

  /** Updates the ticket's status and optimistically patches the local record to reflect the change. */
  changeStatus(newStatus: string) {
    if (!this.ticket) return;
    this.adminService.updateTicketStatus(this.ticket.id, newStatus).subscribe({
      next: (updated) => {
        if (this.ticket) this.ticket = { ...this.ticket, status: updated.status };
      }
    });
  }
}
