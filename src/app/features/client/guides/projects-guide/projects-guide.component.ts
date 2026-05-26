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
