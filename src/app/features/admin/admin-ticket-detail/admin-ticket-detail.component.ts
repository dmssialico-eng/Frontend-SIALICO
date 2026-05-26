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
  ticket:    Ticket | null    = null;
  messages:  TicketMessage[]  = [];
  isLoading  = true;
  isSending  = false;
  currentUserId: number | null = null;

  statusOptions = [
    { value: 'OPEN',        label: 'Abierto' },
    { value: 'IN_PROGRESS', label: 'En proceso' },
    { value: 'ANSWERED',    label: 'Respondido' },
    { value: 'CLOSED',      label: 'Cerrado' },
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
    // Carga el ticket individual via GET /api/tickets/{id}/
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

  changeStatus(newStatus: string) {
    if (!this.ticket) return;
    this.adminService.updateTicketStatus(this.ticket.id, newStatus).subscribe({
      next: (updated) => {
        if (this.ticket) this.ticket = { ...this.ticket, status: updated.status };
      }
    });
  }
}
