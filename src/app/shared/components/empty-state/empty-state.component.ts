import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PrimaryButtonComponent } from '../primary-button/primary-button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink, PrimaryButtonComponent],
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <ng-content select="[icon]"></ng-content>
        <svg *ngIf="!hasIcon" width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <p class="empty-message">{{ message }}</p>
      <app-primary-button *ngIf="ctaText && ctaRoute" [routerLink]="ctaRoute" variant="secondary">
        {{ ctaText }}
      </app-primary-button>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      gap: 1rem;
      text-align: center;
    }
    .empty-icon { color: var(--text-muted); }
    .empty-message { color: var(--text-muted); font-size: 0.95rem; }
  `]
})
export class EmptyStateComponent {
  @Input() message = 'No hay datos disponibles.';
  @Input() ctaText = '';
  @Input() ctaRoute = '';
  @Input() hasIcon = false;
}