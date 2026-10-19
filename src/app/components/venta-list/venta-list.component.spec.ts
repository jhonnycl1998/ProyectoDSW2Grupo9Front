import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { VentaListComponent } from './venta-list.component';
import { Venta } from '../../models/venta.model';

describe('Sale detail cancellation', () => {
  it('preserves the selected sale when switching to the cancellation dialog', () => {
    vi.useFakeTimers();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [VentaListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    const http = TestBed.inject(HttpTestingController);
    const sale: Venta = {idVenta: 4, total: 39, username: 'admin', estado: 'CONFIRMADA', detalles: []};
    const fixture = TestBed.createComponent(VentaListComponent);
    try {
      fixture.detectChanges();
      http.expectOne('http://localhost:8080/api/ventas').flush([sale]);
      fixture.componentInstance.abrirDetalle(sale);
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.modal-backdrop .btn-danger').click();
      fixture.detectChanges();
      expect(fixture.componentInstance.ventaToAnular).toEqual(sale);
      expect(fixture.nativeElement.textContent).toContain('Confirmar Anulación');
      fixture.nativeElement.querySelector('.modal-backdrop .btn-danger').click();
      const cancel = http.expectOne('http://localhost:8080/api/ventas/4/anular');
      expect(cancel.request.method).toBe('PATCH');
      const cancelled = {...sale, estado: 'ANULADA'};
      cancel.flush(cancelled);
      http.expectOne('http://localhost:8080/api/ventas').flush([cancelled]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('ANULADA');
      http.verify();
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });
});
