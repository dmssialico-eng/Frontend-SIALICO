/**
 * IntroductionGuideComponent
 *
 * Static article explaining the SIALICO platform to new users.
 * All content is in the HTML template; this component has no logic.
 *
 * Route: /guides/introduction — protected by authGuard.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-introduction-guide',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './introduction-guide.component.html',
  styleUrls: ['./introduction-guide.component.css']
})
export class IntroductionGuideComponent {}
