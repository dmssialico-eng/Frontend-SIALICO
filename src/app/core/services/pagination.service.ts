/**
 * pagination.service.ts
 *
 * Provides InfiniteScroller — a generic class that manages infinite-scroll
 * pagination against any DRF paginated endpoint. Components subscribe to
 * its reactive observables and call loadMore() on window scroll events.
 *
 * Also exports PaginationService as a factory for creating InfiniteScroller
 * instances with DI-injected HttpClient.
 *
 * Used by: ProjectListComponent, NotificationsComponent, SupportComponent.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standard DRF paginated response envelope.
 */
export interface PagedResult<T> {
  count:    number;
  /** URL for the next page, or null when on the last page. */
  next:     string | null;
  previous: string | null;
  results:  T[];
}

/**
 * Generic infinite-scroll controller for a DRF paginated list endpoint.
 * Accumulates pages into a single items array and tracks loading state.
 *
 * Usage:
 *   const scroller = new InfiniteScroller<Project>(http, '/api/projects/');
 *   scroller.loadMore(); // call again on scroll near bottom
 */
export class InfiniteScroller<T> {
  private _items$    = new BehaviorSubject<T[]>([]);
  private _loading$  = new BehaviorSubject<boolean>(false);
  private _hasMore$  = new BehaviorSubject<boolean>(true);
  /** 1-based page counter for the last successfully loaded page. */
  private currentPage = 0;
  private totalCount  = 0;
  /** Query params that persist across pages (e.g. status filters). */
  private extraParams: Record<string, string> = {};

  /** Observable of all accumulated items across loaded pages. */
  readonly items$    = this._items$.asObservable();
  /** Observable that emits true while a page fetch is in progress. */
  readonly loading$  = this._loading$.asObservable();
  /** Observable that emits false once the last page has been loaded. */
  readonly hasMore$  = this._hasMore$.asObservable();

  /** Synchronous snapshot of the loading state. */
  get isLoading(): boolean  { return this._loading$.value; }
  /** Synchronous snapshot of whether more pages are available. */
  get hasMore():   boolean  { return this._hasMore$.value; }
  /** Synchronous snapshot of all accumulated items. */
  get items():     T[]      { return this._items$.value;   }
  /** Total record count as reported by the server. */
  get total():     number   { return this.totalCount;      }

  constructor(
    private http:    HttpClient,
    private baseUrl: string,
    /** Number of items to request per page. */
    private pageSize = 10
  ) {}

  /**
   * Requests the next page and appends results to the accumulated list.
   * Does nothing if a fetch is already in flight or there are no more pages.
   *
   * @param params - Optional key/value pairs merged into the query string.
   *                 Persisted across subsequent loadMore() calls.
   */
  loadMore(params?: Record<string, string>): void {
    if (this._loading$.value || !this._hasMore$.value) return;

    if (params) this.extraParams = { ...this.extraParams, ...params };

    this._loading$.next(true);
    const nextPage = this.currentPage + 1;

    let httpParams = new HttpParams()
      .set('page', nextPage.toString())
      .set('page_size', this.pageSize.toString());

    Object.entries(this.extraParams).forEach(([k, v]) => {
      httpParams = httpParams.set(k, v);
    });

    this.http.get<PagedResult<T>>(this.baseUrl, { params: httpParams }).subscribe({
      next: (res) => {
        const results: T[] = res.results ?? (res as any);
        this.totalCount = res.count ?? results.length;
        this.currentPage = nextPage;
        this._items$.next([...this._items$.value, ...results]);
        // res.next being null signals the last page has been loaded.
        this._hasMore$.next(!!res.next);
        this._loading$.next(false);
      },
      error: () => { this._loading$.next(false); }
    });
  }

  /**
   * Resets the scroller to its initial state and optionally applies new filter params.
   * Call this when the user changes a filter that requires reloading from page 1.
   *
   * @param params - New query params to apply from the first page onwards.
   */
  reset(params?: Record<string, string>): void {
    this.currentPage = 0;
    this.totalCount  = 0;
    this.extraParams = params ?? {};
    this._items$.next([]);
    this._hasMore$.next(true);
    this._loading$.next(false);
  }
}

/**
 * PaginationService
 *
 * Factory service for creating InfiniteScroller instances.
 * Provides DI-managed HttpClient so callers do not need to inject it directly.
 */
@Injectable({ providedIn: 'root' })
export class PaginationService {
  constructor(private http: HttpClient) {}

  /**
   * Creates a new InfiniteScroller for the given endpoint.
   *
   * @param baseUrl  - Full URL of the DRF list endpoint.
   * @param pageSize - Items per page (default 10).
   * @returns A new InfiniteScroller<T> instance.
   */
  create<T>(baseUrl: string, pageSize = 10): InfiniteScroller<T> {
    return new InfiniteScroller<T>(this.http, baseUrl, pageSize);
  }
}