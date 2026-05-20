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
    /* ── Etiquetas ── */
    .badge-draft              { background: #f3f4f6; color: #6b7280; }
    .badge-submitted          { background: #ede9fe; color: #6d28d9; }
    .badge-in_review          { background: #dbeafe; color: #1d4ed8; }
    .badge-approved           { background: #dcfce7; color: #166534; }
    .badge-needs_changes      { background: #ffedd5; color: #9a3412; }
    .badge-changes_required   { background: #ffedd5; color: #9a3412; }
    /* ── Tickets ── */
    .badge-open               { background: #dbeafe; color: #1d4ed8; }
    .badge-in_progress        { background: #fef9c3; color: #854d0e; }
    .badge-answered           { background: #d1fae5; color: #065f46; }
    .badge-closed             { background: #f3f4f6; color: #374151; }
    /* ── Proyectos ── */
    .badge-active             { background: #dcfce7; color: #166534; }
    .badge-paused             { background: #fef9c3; color: #854d0e; }
    .badge-archived           { background: #f3f4f6; color: #6b7280; }
    .badge-closed_project     { background: #fee2e2; color: #991b1b; }
    /* ── Pagos ── */
    .badge-pending            { background: #fef9c3; color: #854d0e; }
    .badge-confirmed          { background: #dcfce7; color: #166534; }
    .badge-rejected           { background: #fee2e2; color: #991b1b; }
    .badge-cancelled          { background: #f3f4f6; color: #6b7280; }
    /* ── Consultoría ── */
    .badge-requested          { background: #ede9fe; color: #6d28d9; }
    .badge-scheduled          { background: #dbeafe; color: #1d4ed8; }
    .badge-completed          { background: #dcfce7; color: #166534; }
    .badge-pending_payment    { background: #fef9c3; color: #854d0e; }
  `]
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() type: BadgeType = 'label';

  get badgeClass(): string {
    const normalized = this.status?.toLowerCase().replace(/ /g, '_');
    // 'closed' de proyectos colisiona con 'closed' de tickets; se maneja igual
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
