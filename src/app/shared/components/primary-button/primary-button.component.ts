/**
 * PrimaryButtonComponent
 *
 * Reusable styled button component with loading spinner and variant support.
 * Button content is provided via content projection (ng-content).
 *
 * @Input() type      - HTML button type attribute; defaults to 'button'.
 * @Input() fullWidth - When true, the button stretches to fill its container.
 * @Input() loading   - Replaces button content with a spinner and disables clicks.
 * @Input() disabled  - Disables the button without showing a spinner.
 * @Input() variant   - Visual style: 'primary' (filled blue) or 'secondary' (outlined).
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-primary-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './primary-button.component.html',
  styleUrls: ['./primary-button.component.css']
})
export class PrimaryButtonComponent {
  /** HTML button type; use 'submit' inside forms that should trigger ngSubmit. */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  /** Expands the button to 100% of its parent container width. */
  @Input() fullWidth = false;
  /** Shows a loading spinner and prevents interaction while an async operation is in progress. */
  @Input() loading = false;
  /** Disables the button (no spinner). */
  @Input() disabled = false;
  /** 'primary' = solid background; 'secondary' = outlined border style. */
  @Input() variant: 'primary' | 'secondary' = 'primary';
}
