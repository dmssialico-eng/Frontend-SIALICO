import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    /* ── Estados de aprobación / éxito ── */
    .badge-approved, .badge-confirmed, .badge-active, .badge-completed, .badge-answered {
      background: color-mix(in srgb, var(--success) 15%, transparent);
      color: color-mix(in srgb, var(--success) 80%, #000);
    }
    /* ── Estados en progreso / advertencia ── */
    .badge-in_progress, .badge-paused, .badge-scheduled {
      background: color-mix(in srgb, var(--warning) 15%, transparent);
      color: color-mix(in srgb, var(--warning) 70%, #000);
    }
    /* ── Estados de revisión / acción requerida ── */
    .badge-rejected, .badge-changes_required, .badge-needs_changes,
    .badge-project-closed {
      background: color-mix(in srgb, var(--danger) 15%, transparent);
      color: color-mix(in srgb, var(--danger) 80%, #000);
    }
    /* ── Estados neutros / cerrados ── */
    .badge-draft, .badge-ticket-closed, .badge-archived,
    .badge-cancelled, .badge-pending_payment {
      background: #f3f4f6;
      color: #6b7280;
    }
    /* ── Estados enviados / en cola ── */
    .badge-submitted, .badge-requested, .badge-in_review, .badge-open {
      background: color-mix(in srgb, var(--primary-blue) 12%, transparent);
      color: var(--primary-blue-dark);
    }
    /* ── Pagos pendientes (amarillo) ── */
    .badge-payment-pending, .badge-pending {
      background: color-mix(in srgb, var(--warning) 15%, transparent);
      color: color-mix(in srgb, var(--warning) 70%, #000);
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() type: BadgeType = 'label';

  get badgeClass(): string {
    const normalized = this.status?.toLowerCase().replace(/ /g, '_');
    // Para estados que colisionan entre tipos, prefija con el tipo
    const ambiguous = ['closed', 'pending', 'cancelled'];
    if (ambiguous.includes(normalized) && this.type) {
      return `badge-${this.type}-${normalized}`;
    }
    return `badge-${normalized}`;
  }

  get badgeLabel(): string {
    const labels: Record<string, string> = {
      // Etiquetas
      draft:            'Borrador',
      submitted:        'Enviada',
      in_review:        'En revisión',
      approved:         'Aprobada',
      needs_changes:    'Requiere cambios',
      changes_required: 'Requiere cambios',
      // Tickets
      open:        'Abierto',
      in_progress: 'En proceso',
      answered:    'Respondido',
      closed:      'Cerrado',
      // Proyectos
      active:   'Activo',
      paused:   'Pausado',
      archived: 'Archivado',
      // Pagos
      pending:   'Pendiente',
      confirmed: 'Confirmado',
      rejected:  'Rechazado',
      cancelled: 'Cancelado',
      // Consultoría
      requested:       'Solicitada',
      pending_payment: 'Pago pendiente',
      scheduled:       'Agendada',
      completed:       'Completada',
    };
    return labels[this.status?.toLowerCase()] ?? this.status;
  }
}
