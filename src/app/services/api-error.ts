import { HttpErrorResponse } from '@angular/common/http';

export function getErrorMessage(error: HttpErrorResponse, fallback: string): string {
  const detalles = Object.values(error.error?.errores ?? {}).join('. ');
  return detalles || error.error?.mensaje || error.error?.message || fallback;
}
