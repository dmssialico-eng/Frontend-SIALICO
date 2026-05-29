/**
 * SialicoLogoComponent
 *
 * Renders the SIALICO brand logo at one of three predefined sizes.
 * Used in both layout sidebars and the auth pages (login, register, onboarding).
 *
 * @Input() size - Controls the rendered dimensions: 'sm' (sidebar), 'md' (default), 'lg' (auth pages).
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sialico-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sialico-logo.component.html',
  styleUrls: ['./sialico-logo.component.css']
})
export class SialicoLogoComponent {
  /** Controls the rendered size of the logo image. */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}