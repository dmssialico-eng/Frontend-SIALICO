import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ticket, TicketMessage } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${environment.apiUrl}/tickets`;
  private messageApiUrl = `${environment.apiUrl}/ticket-messages`;

  constructor(private http: HttpClient) {}

  getTickets(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/`);
  }

  createTicket(payload: any): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/`, payload);
  }

  getTicketMessages(ticketId: number): Observable<any> {
    return this.http.get<any>(`${this.messageApiUrl}/?ticket=${ticketId}`);
  }

  createTicketMessage(ticketId: number, message: string): Observable<TicketMessage> {
    return this.http.post<TicketMessage>(`${this.messageApiUrl}/`, { ticket: ticketId, message });
  }
}
