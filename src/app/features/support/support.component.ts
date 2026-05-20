import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { TicketThreadComponent } from '../../shared/components/ticket-thread/ticket-thread.component';
import { Ticket, TicketMessage } from '../../core/models/models';

type SupportView = 'list' | 'new' | 'detail';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PrimaryButtonComponent,
    StatusBadgeComponent,
    TicketThreadComponent,
  ],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit {
  view: SupportView = 'list';
  tickets:        Ticket[]        = [];
  selectedTicket: Ticket | null   = null;
  messages:       TicketMessage[] = [];
  currentUserId:  number | null   = null;

  isLoadingTickets  = true;
  isLoadingMessages = false;
  isCreating        = false;
  isSending         = false;

  newTicketForm!: FormGroup;

  priorityOptions = [
    { value: 'LOW',      label: 'Baja' },
    { value: 'MEDIUM',   label: 'Media' },
    { value: 'HIGH',     label: 'Alta' },
    { value: 'CRITICAL', label: 'Crítica' },
  ];

  constructor(
    private ticketService: TicketService,
    private authService:   AuthService,
    private fb:            FormBuilder
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id ?? null;

    this.newTicketForm = this.fb.group({
      subject:     ['', Validators.required],
      description: ['', Validators.required],
      priority:    ['MEDIUM'],
    });

    this.loadTickets();
  }

  loadTickets() {
    this.isLoadingTickets = true;
    this.ticketService.getTickets().subscribe({
      next: (res: any) => {
        this.tickets = res.results ?? res;
        this.isLoadingTickets = false;
      },
      error: () => { this.isLoadingTickets = false; }
    });
  }

  openTicket(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.messages = [];
    this.view = 'detail';
    this.isLoadingMessages = true;

    this.ticketService.getTicketMessages(ticket.id).subscribe({
      next: (res: any) => {
        this.messages = res.results ?? res;
        this.isLoadingMessages = false;
      },
      error: () => { this.isLoadingMessages = false; }
    });
  }

  createTicket() {
    if (this.newTicketForm.invalid || this.isCreating) return;
    this.isCreating = true;

    this.ticketService.createTicket(this.newTicketForm.value).subscribe({
      next: (ticket) => {
        this.tickets.unshift(ticket);
        this.newTicketForm.reset({ priority: 'MEDIUM' });
        this.isCreating = false;
        this.openTicket(ticket);
      },
      error: () => { this.isCreating = false; }
    });
  }

  sendMessage(text: string) {
    if (!this.selectedTicket || this.isSending) return;
    this.isSending = true;

    this.ticketService.createTicketMessage(this.selectedTicket.id, text).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.isSending = false;
      },
      error: () => { this.isSending = false; }
    });
  }

  goToList() {
    this.view = 'list';
    this.selectedTicket = null;
    this.messages = [];
  }

  isOpen(ticket: Ticket): boolean {
    return ticket.status?.toUpperCase() !== 'CLOSED';
  }
}
