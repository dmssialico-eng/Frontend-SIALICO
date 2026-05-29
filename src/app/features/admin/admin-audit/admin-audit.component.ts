/**
 * AdminAuditComponent
 *
 * Displays paginated audit logs with real-time text filtering by entity and actor.
 * Filter inputs are debounced (400 ms) and deduplicated before triggering a reload
 * so a single key press does not fire multiple API calls.
 *
 * The page size is 20 (defined by the API); `totalCount` is used to calculate
 * `totalPages` and disable the next-page button at the last page.
 *
 * Route: /admin/audit — protected by authGuard + roleGuard (ADMIN).
 * Depends on: AuditService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuditService } from '../../../core/services/audit.service';
import { AuditLog } from '../../../shared/models/models';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-audit.component.html',
  styleUrls: ['./admin-audit.component.css']
})
export class AdminAuditComponent implements OnInit {
  logs: AuditLog[] = [];
  /** Total number of matching log entries across all pages, returned by the API. */
  totalCount = 0;
  isLoading  = true;
  errorMsg   = '';
  /** Current 1-based page number; reset to 1 whenever the filter changes. */
  page       = 1;

  filterForm!: FormGroup;

  constructor(
    private auditService: AuditService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.filterForm = this.fb.group({ entity: [''], actor: [''] });

    // Debounce to avoid an API call on every keypress; JSON.stringify comparison
    // prevents a reload when the value changes to the same string (e.g. blur events).
    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(() => {
      this.page = 1;
      this.loadLogs();
    });

    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    this.errorMsg  = '';
    const { entity, actor } = this.filterForm.value;

    this.auditService.getLogs({ entity: entity || undefined, actor: actor || undefined, page: this.page }).subscribe({
      next: ({ results, count }) => {
        this.logs       = results;
        this.totalCount = count;
        this.isLoading  = false;
      },
      error: () => {
        this.errorMsg  = 'No se pudieron cargar los registros de auditoría.';
        this.isLoading = false;
      }
    });
  }

  prevPage() {
    if (this.page > 1) { this.page--; this.loadLogs(); }
  }

  nextPage() {
    if (this.page * 20 < this.totalCount) { this.page++; this.loadLogs(); }
  }

  /** Total page count based on the API's page size of 20. */
  get totalPages(): number { return Math.ceil(this.totalCount / 20); }

  /** Flattens an audit log's metadata object into a readable key: value string for display. */
  formatMetadata(meta: Record<string, any>): string {
    if (!meta || Object.keys(meta).length === 0) return '—';
    return Object.entries(meta).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
  }
}
