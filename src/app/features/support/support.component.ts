import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimaryButtonComponent],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit {
  chatMessages: {text: string, isBot: boolean}[] = [
    { text: 'Hola, ¿cómo puedo ayudarte?', isBot: true }
  ];
  newMessage = '';
  activeTicketId: number | null = null;
  isSending = false;

  constructor(private ticketService: TicketService) {}

  ngOnInit() {}

  sendMessage() {
    if (!this.newMessage.trim() || this.isSending) return;

    const userText = this.newMessage;
    this.chatMessages.push({ text: userText, isBot: false });
    this.newMessage = '';
    this.isSending = true;

    if (!this.activeTicketId) {
      // Create a ticket first
      this.ticketService.createTicket({
        subject: 'Soporte vía chat',
        description: userText,
        priority: 'MEDIUM'
      }).subscribe({
        next: (ticket) => {
          this.activeTicketId = ticket.id;
          this.simulateBotReply();
        },
        error: () => {
          this.isSending = false;
        }
      });
    } else {
      // Just add a message
      this.ticketService.createTicketMessage(this.activeTicketId, userText).subscribe({
        next: () => {
          this.simulateBotReply();
        },
        error: () => {
          this.isSending = false;
        }
      });
    }
  }

  simulateBotReply() {
    setTimeout(() => {
      this.chatMessages.push({ text: 'Gracias, hemos registrado tu solicitud. Un agente de Sialico la revisará pronto.', isBot: true });
      this.isSending = false;
    }, 1000);
  }
}
