/**
 * StatusBadgeComponent
 *
 * Displays a color-coded pill badge for any domain entity status.
 * The `type` input disambiguates status values that are shared across
 * entity types (e.g. "closed" means different things for tickets vs. projects).
 *
 * @Input() status - The raw status string from the API (e.g. 'APPROVED', 'IN_REVIEW').
 * @Input() type   - Entity type context for disambiguating ambiguous status names.
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Entity type used to disambiguate status values that appear in multiple domains. */
export type BadgeType = 'label' | 'ticket' | 'project' | 'payment' | 'consultation';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="badgeClass">{{ badgeLabel }}</span>`,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }
    /* Approved / success states */
    .badge-approved, .badge-confirmed, .badge-active, .badge-completed, .badge-answered {
      background: color-mix(in srgb, var(--success) 15%, transparent);
      color: color-mix(in srgb, var(--success) 80%, #000);
    }
    /* In-progress / warning states */
    .badge-in_progress, .badge-paused, .badge-scheduled {
      background: color-mix(in srgb, var(--warning) 15%, transparent);
      color: color-mix(in srgb, var(--warning) 70%, #000);
    }
    /* Review required / action needed states */
    .badge-rejected, .badge-changes_required, .badge-needs_changes,
    .badge-project-closed {
      background: color-mix(in srgb, var(--danger) 15%, transparent);
      color: color-mix(in srgb, var(--danger) 80%, #000);
    }
    /* Neutral / closed states */
    .badge-draft, .badge-ticket-closed, .badge-archived,
    .badge-cancelled, .badge-pending_payment {
      background: #f3f4f6;
      color: #6b7280;
    }
    /* Submitted / queued / open states */
    .badge-submitted, .badge-requested, .badge-in_review, .badge-open {
      background: color-mix(in srgb, var(--primary-blue) 12%, transparent);
      color: var(--primary-blue-dark);
    }
    /* Pending payment states */
    .badge-payment-pending, .badge-pending {
      background: color-mix(in srgb, var(--warning) 15%, transparent);
      color: color-mix(in srgb, var(--warning) 70%, #000);
    }
  `]
})
export class StatusBadgeComponent {
  /** Raw status string from the API (e.g. 'APPROVED', 'IN_REVIEW'). */
  @Input() status = '';
  /** Entity type context needed to resolve ambiguous status names. */
  @Input() type: BadgeType = 'label';

  /**
   * Builds the CSS class for the badge color.
   * Ambiguous statuses ('closed', 'pending', 'cancelled') are prefixed with
   * the entity type to select the correct color variant.
   */
  get badgeClass(): string {
    const normalized = this.status?.toLowerCase().replace(/ /g, '_');
    // These status names collide across entity types and need a type prefix.
    const ambiguous = ['closed', 'pending', 'cancelled'];
    if (ambiguous.includes(normalized) && this.type) {
      return `badge-${this.type}-${normalized}`;
    }
    return `badge-${normalized}`;
  }

  /** Returns the localized display label for the status, falling back to the raw value. */
  get badgeLabel(): string {
    const labels: Record<string, string> = {
      draft:            'Borrador',
      submitted:        'Enviada',
      in_review:        'En revisión',
      approved:         'Aprobada',
      needs_changes:    'Requiere cambios',
      changes_required: 'Requiere cambios',
      open:             'Abierto',
      in_progress:      'En proceso',
      answered:         'Respondido',
      closed:           'Cerrado',
      active:           'Activo',
      paused:           'Pausado',
      archived:         'Archivado',
      pending:          'Pendiente',
      confirmed:        'Confirmado',
      rejected:         'Rechazado',
      cancelled:        'Cancelado',
      requested:        'Solicitada',
      pending_payment:  'Pago pendiente',
      scheduled:        'Agendada',
      completed:        'Completada',
    };
    return labels[this.status?.toLowerCase()] ?? this.status;
  }
}
