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

  getTickets(status?: string): Observable<any> {
    const params = status
      ? new HttpParams().set('status', status.toUpperCase())
      : new HttpParams();
    return this.http.get<any>(`${this.ticketsUrl}/`, { params });
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.ticketsUrl}/${id}/`);
  }

  createTicket(payload: { subject: string; description: string; priority: string }): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.ticketsUrl}/`, payload);
  }

  getTicketMessages(ticketId: number): Observable<any> {
    const params = new HttpParams().set('ticket', ticketId.toString());
    return this.http.get<any>(`${this.messagesUrl}/`, { params });
  }

  createTicketMessage(ticketId: number, message: string): Observable<TicketMessage> {
    return this.http.post<TicketMessage>(`${this.messagesUrl}/`, { ticket: ticketId, message });
  }
}
