import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PagedResult<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

export class InfiniteScroller<T> {
  private _items$    = new BehaviorSubject<T[]>([]);
  private _loading$  = new BehaviorSubject<boolean>(false);
  private _hasMore$  = new BehaviorSubject<boolean>(true);
  private currentPage = 0;
  private totalCount  = 0;
  private extraParams: Record<string, string> = {};

  readonly items$    = this._items$.asObservable();
  readonly loading$  = this._loading$.asObservable();
  readonly hasMore$  = this._hasMore$.asObservable();

  get isLoading(): boolean  { return this._loading$.value; }
  get hasMore():   boolean  { return this._hasMore$.value; }
  get items():     T[]      { return this._items$.value;   }
  get total():     number   { return this.totalCount;      }

  constructor(
    private http:    HttpClient,
    private baseUrl: string,
    private pageSize = 10
  ) {}

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
        this._hasMore$.next(!!res.next);
        this._loading$.next(false);
      },
      error: () => { this._loading$.next(false); }
    });
  }

  reset(params?: Record<string, string>): void {
    this.currentPage = 0;
    this.totalCount  = 0;
    this.extraParams = params ?? {};
    this._items$.next([]);
    this._hasMore$.next(true);
    this._loading$.next(false);
  }
}

@Injectable({ providedIn: 'root' })
export class PaginationService {
  constructor(private http: HttpClient) {}

  create<T>(baseUrl: string, pageSize = 10): InfiniteScroller<T> {
    return new InfiniteScroller<T>(this.http, baseUrl, pageSize);
  }
}