import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-guides-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './guides-home.component.html',
  styleUrls: ['./guides-home.component.css']
})
export class GuidesHomeComponent {}
