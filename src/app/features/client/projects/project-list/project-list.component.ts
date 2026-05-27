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
  scroller!: InfiniteScroller<Project>;
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

  @HostListener('window:scroll')
  onScroll() {
    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.scrollHeight - 200;
    if (nearBottom) this.scroller.loadMore();
  }
}