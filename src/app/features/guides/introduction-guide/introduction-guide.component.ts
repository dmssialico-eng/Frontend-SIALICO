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
