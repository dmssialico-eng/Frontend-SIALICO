/**
 * TicketService
 *
 * Manages support ticket operations for both clients and admins:
 * listing, creating, and fetching individual tickets, plus sending
 * and retrieving messages within a ticket thread.
 *
 * Endpoints used:
 *   GET/POST /api/tickets/
 *   GET      /api/tickets/{id}/
 *   GET/POST /api/ticket-messages/
 *
 * Used by: SupportComponent, AdminTicketsComponent,
 *          AdminTicketDetailComponent.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ticket, TicketMessage } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private ticketsUrl  = `${environment.apiUrl}/tickets`;
  private messagesUrl = `${environment.apiUrl}/ticket-messages`;

  constructor(private http: HttpClient) {}

  /**
   * Returns a list of tickets, optionally filtered by status.
   *
   * @param status - Optional ticket status (e.g. 'OPEN'). Omit for all tickets.
   * @returns Observable of the raw paginated response.
   */
  getTickets(status?: string): Observable<any> {
    const params = status
      ? new HttpParams().set('status', status.toUpperCase())
      : new HttpParams();
    return this.http.get<any>(`${this.ticketsUrl}/`, { params });
  }

  /**
   * Fetches the full detail of a single ticket.
   *
   * @param id - Ticket primary key.
   * @returns Observable<Ticket>.
   */
  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.ticketsUrl}/${id}/`);
  }

  /**
   * Creates a new support ticket via POST /api/tickets/.
   *
   * @param payload.subject     - Short description of the issue.
   * @param payload.description - Detailed explanation.
   * @param payload.priority    - Priority level (e.g. 'MEDIUM', 'HIGH').
   * @returns Observable<Ticket> — the created ticket.
   */
  createTicket(payload: { subject: string; description: string; priority: string }): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.ticketsUrl}/`, payload);
  }

  /**
   * Returns all messages for a given ticket thread.
   *
   * @param ticketId - Ticket primary key.
   * @returns Observable of the raw paginated response.
   */
  getTicketMessages(ticketId: number): Observable<any> {
    const params = new HttpParams().set('ticket', ticketId.toString());
    return this.http.get<any>(`${this.messagesUrl}/`, { params });
  }

  /**
   * Posts a new message to a ticket thread via POST /api/ticket-messages/.
   *
   * @param ticketId - Ticket primary key.
   * @param message  - Message body text.
   * @returns Observable<TicketMessage> — the created message.
   */
  createTicketMessage(ticketId: number, message: string): Observable<TicketMessage> {
    return this.http.post<TicketMessage>(`${this.messagesUrl}/`, { ticket: ticketId, message });
  }
}
