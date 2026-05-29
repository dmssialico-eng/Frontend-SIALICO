/**
 * TicketThreadComponent
 *
 * Displays the conversation thread for a support ticket and provides
 * a message input for the user to send new messages. Own messages are
 * aligned differently from admin messages via the `own` / `other` CSS classes.
 *
 * @Input()  messages       - Ordered list of TicketMessage objects to display.
 * @Input()  isSending      - True while a message POST is in progress; disables the send button.
 * @Input()  currentUserId  - The logged-in user's ID; used to differentiate own vs. other bubbles.
 * @Output() send           - Emits the message string when the user submits a new message.
 *
 * Used by: SupportComponent, AdminTicketDetailComponent.
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketMessage } from '../../../shared/models/models';

@Component({
  selector: 'app-ticket-thread',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-thread.component.html',
  styleUrls: ['./ticket-thread.component.css']
})
export class TicketThreadComponent {
  /** Ordered list of messages to render in the thread. */
  @Input() messages: TicketMessage[] = [];
  /** Disables the send button while the parent component's HTTP request is in flight. */
  @Input() isSending = false;
  /** The current user's ID; messages with sender === currentUserId are shown as own bubbles. */
  @Input() currentUserId: number | null = null;
  /** Emits the trimmed message text when the user clicks Send or presses Enter. */
  @Output() send = new EventEmitter<string>();

  /** Holds the text currently typed in the message textarea. */
  newMessage = '';

  /** Emits the message and resets the textarea; does nothing if the input is empty. */
  sendMessage() {
    const text = this.newMessage.trim();
    if (!text || this.isSending) return;
    this.send.emit(text);
    this.newMessage = '';
  }

  /**
   * Returns true when the message was sent by the current user.
   * Used to apply the right-aligned `own` CSS class.
   */
  isOwnMessage(msg: TicketMessage): boolean {
    return msg.sender === this.currentUserId;
  }
}