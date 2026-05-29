/**
 * AppComponent
 *
 * Root shell component. Renders a single <router-outlet> that the Angular
 * router uses to mount the active route's component tree.
 * All application logic lives in child components and services.
 */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {}