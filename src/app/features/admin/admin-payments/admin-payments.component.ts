import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Payment } from '../../../shared/models/models';

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
  isLoading     = true;
  activeTab: PaymentTab = 'PENDING';
  actioningId:  number | null = null;
  errorMessage  = '';
  successMessage = '';
  lastActionPayment: Payment | null = null; // para mostrar en el toast qué pago se procesó

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

  private updateLocal(updated: Payment) {
    const idx = this.payments.findIndex(p => p.id === updated.id);
    if (idx !== -1) this.payments[idx] = updated;
    if (this.activeTab !== 'ALL') {
      this.payments = this.payments.filter(p => p.status === this.activeTab);
    }
  }

  formatCurrency(amount: string | number, currency = 'MXN'): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(amount));
  }
}