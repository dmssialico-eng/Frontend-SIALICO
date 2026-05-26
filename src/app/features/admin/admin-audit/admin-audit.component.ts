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
  totalCount = 0;
  isLoading  = true;
  errorMsg   = '';
  page       = 1;

  filterForm!: FormGroup;

  constructor(
    private auditService: AuditService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.filterForm = this.fb.group({ entity: [''], actor: [''] });

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

  get totalPages(): number { return Math.ceil(this.totalCount / 20); }

  formatMetadata(meta: Record<string, any>): string {
    if (!meta || Object.keys(meta).length === 0) return '—';
    return Object.entries(meta).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
  }
}
