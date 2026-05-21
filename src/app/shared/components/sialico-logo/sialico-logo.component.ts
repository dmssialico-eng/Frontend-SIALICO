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
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}