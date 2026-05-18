import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketMessage } from '../../../core/models/models';

@Component({
  selector: 'app-ticket-thread',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-thread.component.html',
  styleUrls: ['./ticket-thread.component.css']
})
export class TicketThreadComponent {
  @Input() messages: TicketMessage[] = [];
  @Input() isSending = false;
  @Input() currentUserId: number | null = null;
  @Output() send = new EventEmitter<string>();

  newMessage = '';

  sendMessage() {
    const text = this.newMessage.trim();
    if (!text || this.isSending) return;
    this.send.emit(text);
    this.newMessage = '';
  }

  isOwnMessage(msg: TicketMessage): boolean {
    return msg.sender === this.currentUserId;
  }
}