import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsultationService } from '../../core/services/consultation.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { Consultation } from '../../core/models/models';

type ConsView = 'list' | 'new';

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimaryButtonComponent, StatusBadgeComponent],
  templateUrl: './consultations.component.html',
  styleUrls: ['./consultations.component.css']
})
export class ConsultationsComponent implements OnInit {
  view: ConsView = 'list';
  consultations: Consultation[] = [];
  isLoading  = true;
  isCreating = false;
  errorMessage   = '';
  successMessage = '';

  form!: FormGroup;

  constructor(
    private consultationService: ConsultationService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      topic:       ['', Validators.required],
      description: ['', Validators.required],
    });
    this.loadConsultations();
  }

  loadConsultations() {
    this.isLoading = true;
    this.consultationService.getConsultations().subscribe({
      next: (data) => {
        this.consultations = data;
        this.isLoading     = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  createConsultation() {
    if (this.form.invalid || this.isCreating) return;
    this.isCreating  = true;
    this.errorMessage = '';

    this.consultationService.createConsultation(this.form.value).subscribe({
      next: (c) => {
        this.consultations.unshift(c);
        this.form.reset();
        this.view          = 'list';
        this.isCreating    = false;
        this.successMessage = 'Consultoría solicitada correctamente. El equipo Sialico se pondrá en contacto contigo.';
        setTimeout(() => { this.successMessage = ''; }, 4000);
      },
      error: () => {
        this.errorMessage = 'No se pudo crear la consultoría. Intenta de nuevo.';
        this.isCreating   = false;
      }
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      REQUESTED:       'Solicitada',
      PENDING_PAYMENT: 'Pago pendiente',
      SCHEDULED:       'Agendada',
      IN_PROGRESS:     'En progreso',
      COMPLETED:       'Completada',
      CANCELLED:       'Cancelada',
    };
    return map[status?.toUpperCase()] ?? status;
  }
}
