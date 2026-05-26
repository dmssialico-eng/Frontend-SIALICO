import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface ChecklistItem {
  text: string;
  done: boolean;
}

interface Checklist {
  id: string;
  title: string;
  preview: string[];
  items: ChecklistItem[];
}

@Component({
  selector: 'app-guides-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './guides-home.component.html',
  styleUrls: ['./guides-home.component.css']
})
export class GuidesHomeComponent {

  activeChecklist: Checklist | null = null;

  checklists: Checklist[] = [
    {
      id: 'inicio-proyecto',
      title: 'Inicio de proyecto',
      preview: ['Definir objetivos y alcance', 'Asignar roles y responsabilidades'],
      items: [
        { text: 'Definir objetivos y alcance del proyecto', done: false },
        { text: 'Asignar roles y responsabilidades al equipo', done: false },
        { text: 'Identificar normativas aplicables (FDA, COFEPRIS, NOM, etc.)', done: false },
        { text: 'Crear el proyecto en la plataforma', done: false },
        { text: 'Agregar productos y categorías', done: false },
        { text: 'Subir documentación técnica inicial', done: false },
        { text: 'Configurar notificaciones de fechas clave', done: false },
        { text: 'Agendar primera revisión de etiquetado', done: false },
      ]
    },
    {
      id: 'cierre-sprint',
      title: 'Cierre de sprint',
      preview: ['Revisar tareas completadas', 'Documentar aprendizajes clave'],
      items: [
        { text: 'Revisar tareas completadas en el sprint', done: false },
        { text: 'Documentar aprendizajes y observaciones clave', done: false },
        { text: 'Verificar estado de etiquetas enviadas a revisión', done: false },
        { text: 'Actualizar estatus de productos en la plataforma', done: false },
        { text: 'Comunicar avances al equipo y stakeholders', done: false },
        { text: 'Revisar tickets de soporte abiertos', done: false },
        { text: 'Planificar objetivos del siguiente sprint', done: false },
      ]
    },
    {
      id: 'onboarding-equipo',
      title: 'Onboarding de equipo',
      preview: ['Configurar accesos y permisos', 'Presentar herramientas y procesos'],
      items: [
        { text: 'Crear cuentas para los nuevos miembros', done: false },
        { text: 'Configurar accesos y permisos por rol', done: false },
        { text: 'Presentar la plataforma y sus módulos principales', done: false },
        { text: 'Asignar miembros a proyectos existentes', done: false },
        { text: 'Compartir guías de introducción y proyectos', done: false },
        { text: 'Realizar primera sesión de trabajo guiada', done: false },
        { text: 'Verificar que todos puedan acceder correctamente', done: false },
      ]
    }
  ];

  openChecklist(checklist: Checklist): void {
    this.activeChecklist = {
      ...checklist,
      items: checklist.items.map(item => ({ ...item, done: false }))
    };
  }

  closeChecklist(): void {
    this.activeChecklist = null;
  }

  toggleItem(index: number): void {
    if (!this.activeChecklist) return;
    this.activeChecklist.items[index].done = !this.activeChecklist.items[index].done;
  }

  get completedCount(): number {
    return this.activeChecklist?.items.filter(i => i.done).length ?? 0;
  }

  get totalCount(): number {
    return this.activeChecklist?.items.length ?? 0;
  }

  get progressPercent(): number {
    if (!this.totalCount) return 0;
    return Math.round((this.completedCount / this.totalCount) * 100);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeChecklist();
    }
  }
}