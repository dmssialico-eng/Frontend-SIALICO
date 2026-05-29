/**
 * AdminPaymentsComponent
 *
 * Admin view for reviewing and actioning pending payments. Payments are
 * re-fetched from the API on every tab switch so the list always reflects
 * the current database state (unlike the ticket list which filters client-side).
 *
 * `actioningId` ensures only one payment can be confirmed/rejected at a time,
 * preventing duplicate API calls if the admin clicks quickly.
 *
 * After confirming or rejecting, `updateLocal()` removes the payment from the
 * filtered list if the active tab no longer matches the payment's new status.
 *
 * Route: /admin/payments — protected by authGuard + roleGuard (ADMIN).
 * Depends on: AdminService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Payment } from '../../../shared/models/models';

/** Tab identifiers corresponding to the payment status values used as API filter params. */
type PaymentTab = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'ALL';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './admin-payments.component.html',
  styleUrls: ['./admin-payments.component.css']
})
export class AdminPaymentsComponent implements OnInit {
  payments: Payment[] = [];
  isLoading      = true;
  /** Currently selected status tab; drives the API filter on load. */
  activeTab: PaymentTab = 'PENDING';
  /** ID of the payment currently being confirmed or rejected; null when idle. */
  actioningId:  number | null = null;
  errorMessage  = '';
  /** Auto-clears after 4 seconds. */
  successMessage = '';
  /** The payment that was most recently actioned; used to customize the toast message. */
  lastActionPayment: Payment | null = null;

  readonly tabs: { key: PaymentTab; label: string }[] = [
    { key: 'PENDING',   label: 'Pendientes'  },
    { key: 'CONFIRMED', label: 'Confirmados' },
    { key: 'REJECTED',  label: 'Rechazados'  },
    { key: 'ALL',       label: 'Todos'       },
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.loadPayments(); }

  loadPayments() {
    this.isLoading    = true;
    this.errorMessage = '';
    const status = this.activeTab === 'ALL' ? undefined : this.activeTab;

    this.adminService.getAllPayments(status).subscribe({
      next: (res) => {
        this.payments  = res.results ?? res;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los pagos.';
        this.isLoading    = false;
      }
    });
  }

  selectTab(tab: PaymentTab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.loadPayments();
  }

  confirm(p: Payment) {
    if (this.actioningId) return;
    this.actioningId   = p.id;
    this.errorMessage  = '';
    this.successMessage = '';

    this.adminService.confirmPayment(p.id).subscribe({
      next: (updated) => {
        this.updateLocal(updated);
        this.actioningId    = null;
        this.lastActionPayment = updated;
        this.showSuccess(`Pago #${updated.id} confirmado correctamente.`);
      },
      error: () => {
        this.errorMessage = 'No se pudo confirmar el pago.';
        this.actioningId  = null;
      }
    });
  }

  reject(p: Payment) {
    if (this.actioningId) return;
    this.actioningId   = p.id;
    this.errorMessage  = '';
    this.successMessage = '';

    this.adminService.rejectPayment(p.id).subscribe({
      next: (updated) => {
        this.updateLocal(updated);
        this.actioningId    = null;
        this.lastActionPayment = updated;
        this.showSuccess(`Pago #${updated.id} rechazado.`);
      },
      error: () => {
        this.errorMessage = 'No se pudo rechazar el pago.';
        this.actioningId  = null;
      }
    });
  }

  private showSuccess(msg: string) {
    this.successMessage = msg;
    setTimeout(() => { this.successMessage = ''; }, 4000);
  }

  /**
   * Replaces the payment in the local list with the updated record, then removes it
   * from the view when the active tab filters by status (so a confirmed payment
   * disappears from the PENDING tab immediately without a reload).
   */
  private updateLocal(updated: Payment) {
    const idx = this.payments.findIndex(p => p.id === updated.id);
    if (idx !== -1) this.payments[idx] = updated;
    if (this.activeTab !== 'ALL') {
      this.payments = this.payments.filter(p => p.status === this.activeTab);
    }
  }

  /** Formats a numeric amount as a localized currency string (defaults to MXN). */
  formatCurrency(amount: string | number, currency = 'MXN'): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(amount));
  }
}