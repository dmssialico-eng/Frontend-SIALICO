import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {

  getErrorMessage(error: HttpErrorResponse): string {
    if (!navigator.onLine) {
      return 'Sin conexión a internet. Verifica tu red e intenta de nuevo.';
    }
    switch (error.status) {
      case 400: return this.extractValidationMessage(error) ?? 'Los datos enviados no son válidos.';
      case 401: return 'Tu sesión ha expirado. Inicia sesión de nuevo.';
      case 403: return error.error?.detail ?? 'No tienes permisos para realizar esta acción.';
      case 404: return 'El recurso solicitado no existe.';
      case 429: return 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
      case 500:
      case 502:
      case 503: return 'Error en el servidor. Intenta más tarde.';
      default:  return 'Ocurrió un error inesperado. Intenta de nuevo.';
    }
  }

  private extractValidationMessage(error: HttpErrorResponse): string | null {
    const data = error.error;
    if (!data || typeof data !== 'object') return null;
    const firstKey = Object.keys(data)[0];
    if (!firstKey) return null;
    const val = data[firstKey];
    return Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
  }
}
