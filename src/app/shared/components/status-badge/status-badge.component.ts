import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeType = 'label' | 'ticket' | 'project';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass">{{ badgeLabel }}</span>
  `,
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
    .badge-draft         { background: #f3f4f6; color: #6b7280; }
    .badge-submitted     { background: #dbeafe; color: #1d4ed8; }
    .badge-in_review     { background: #fef9c3; color: #854d0e; }
    .badge-approved      { background: #dcfce7; color: #166534; }
    .badge-needs_changes { background: #fee2e2; color: #991b1b; }
    .badge-open        { background: #dbeafe; color: #1d4ed8; }
    .badge-in_progress { background: #fef9c3; color: #854d0e; }
    .badge-resolved    { background: #dcfce7; color: #166534; }
    .badge-closed      { background: #f3f4f6; color: #6b7280; }
    /* Project statuses */
    .badge-active   { background: #dcfce7; color: #166534; }
    .badge-paused   { background: #fef9c3; color: #854d0e; }
    .badge-archived { background: #f3f4f6; color: #6b7280; }
  `]
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() type: BadgeType = 'label';

  get badgeClass(): string {
    return `badge-${this.status?.toLowerCase().replace(' ', '_')}`;
  }

  get badgeLabel(): string {
    const labels: Record<string, string> = {
      // label
      draft:         'Borrador',
      submitted:     'Enviada',
      in_review:     'En revisión',
      approved:      'Aprobada',
      needs_changes: 'Requiere cambios',
      // ticket
      open:        'Abierto',
      in_progress: 'En proceso',
      resolved:    'Resuelto',
      closed:      'Cerrado',
      // project
      active:   'Activo',
      paused:   'Pausado',
      archived: 'Archivado',
    };
    return labels[this.status?.toLowerCase()] || this.status;
  }
}