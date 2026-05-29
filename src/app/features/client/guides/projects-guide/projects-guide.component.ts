/**
 * ProjectsGuideComponent
 *
 * Static guide explaining how to create and manage regulatory projects in SIALICO.
 * All content is in the HTML template; this component has no logic.
 *
 * Route: /guides/projects — protected by authGuard.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-projects-guide',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './projects-guide.component.html',
  styleUrls: ['./projects-guide.component.css']
})
export class ProjectsGuideComponent {}
