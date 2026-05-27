import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TicketService } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { TicketThreadComponent } from '../../../shared/components/ticket-thread/ticket-thread.component';
import { InfiniteScroller } from '../../../core/services/pagination.service';
import { Ticket, TicketMessage } from '../../../shared/models/models';
import { environment } from '../../../../environments/environment';

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
export class SupportComponent implements OnInit, OnDestroy {
  view: SupportView = 'list';
  scroller!: InfiniteScroller<Ticket>;
  selectedTicket: Ticket | null   = null;
  messages:       TicketMessage[] = [];
  currentUserId:  number | null   = null;

  isLoadingMessages = false;
  isCreating        = false;
  isSending         = false;
  errorMessage      = '';

  newTicketForm!: FormGroup;

  constructor(
    private http:          HttpClient,
    private ticketService: TicketService,
    private authService:   AuthService,
    private errorHandler:  ErrorHandlerService,
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

    this.initScroller();
  }

  ngOnDestroy() {}

  private initScroller() {
    this.scroller = new InfiniteScroller<Ticket>(
      this.http,
      `${environment.apiUrl}/tickets/`
    );
    this.scroller.loadMore();
  }

  @HostListener('window:scroll')
  onScroll() {
    if (this.view !== 'list') return;
    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.scrollHeight - 200;
    if (nearBottom) this.scroller.loadMore();
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
    this.errorMessage = '';

    this.ticketService.createTicket(this.newTicketForm.value).subscribe({
      next: (ticket) => {
        // Agregar al inicio de la lista acumulada
        this.scroller.items.unshift(ticket);
        this.newTicketForm.reset({ priority: 'MEDIUM' });
        this.isCreating = false;
        this.openTicket(ticket);
      },
      error: (err) => {
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        this.isCreating = false;
      }
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