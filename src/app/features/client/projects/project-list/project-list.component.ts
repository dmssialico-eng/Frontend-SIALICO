/**
 * ProjectListComponent
 *
 * Displays all projects belonging to the authenticated user using infinite
 * scroll pagination. A new page is fetched whenever the user scrolls within
 * 200 px of the document bottom.
 *
 * Uses InfiniteScroller directly with HttpClient rather than ProjectService
 * because InfiniteScroller manages its own accumulation of pages and does not
 * fit the single-response pattern that ProjectService returns.
 *
 * Route: /projects — protected by authGuard.
 */
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PrimaryButtonComponent } from '../../../../shared/components/primary-button/primary-button.component';
import { InfiniteScroller } from '../../../../core/services/pagination.service';
import { Project } from '../../../../shared/models/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PrimaryButtonComponent],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit, OnDestroy {
  /** Manages paginated project data and loading/hasMore state for the template. */
  scroller!: InfiniteScroller<Project>;
  /** True when any page load fails; allows the template to show an error banner. */
  loadError = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.scroller = new InfiniteScroller<Project>(
      this.http,
      `${environment.apiUrl}/projects/`
    );
    this.scroller.loadMore();
  }

  ngOnDestroy() {}

  /** Triggers the next page load when the user nears the document bottom. */
  @HostListener('window:scroll')
  onScroll() {
    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.scrollHeight - 200;
    if (nearBottom) this.scroller.loadMore();
  }
}