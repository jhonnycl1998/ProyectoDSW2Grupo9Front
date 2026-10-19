import { getErrorMessage } from '../../services/api-error';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VentaService } from '../../services/venta.service';
import { AuthService } from '../../services/auth.service';
import { Venta } from '../../models/venta.model';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-venta-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './venta-list.component.html',
  styleUrls: ['./venta-list.component.css']
})
export class VentaListComponent implements OnInit {
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Filters
  searchTerm = '';
  filtroEstado = 'TODOS'; // 'TODOS', 'CONFIRMADA', 'ANULADA'

  // Modal Details
  showDetailModal = false;
  selectedVenta: Venta | null = null;

  // Modal Void/Anular
  showAnularModal = false;
  ventaToAnular: Venta | null = null;
  anularLoading = false;

  ventaService = inject(VentaService);
  authService = inject(AuthService);

  ngOnInit(): void {
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.ventaService.listar().subscribe({
      next: (data) => {
        this.ventas = data;
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = getErrorMessage(err, 'Error al cargar las ventas.');
      }
    });
  }

  aplicarFiltros(): void {
    let list = [...this.ventas];

    if (this.filtroEstado !== 'TODOS') {
      list = list.filter(v => (v.estado || 'CONFIRMADA').toUpperCase() === this.filtroEstado);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      list = list.filter(v => 
        (v.idVenta?.toString().includes(term)) ||
        (v.username?.toLowerCase().includes(term))
      );
    }

    this.ventasFiltradas = list;
  }

  abrirDetalle(venta: Venta): void {
    this.selectedVenta = venta;
    this.showDetailModal = true;
  }

  cerrarDetalle(): void {
    this.showDetailModal = false;
    this.selectedVenta = null;
  }

  confirmarAnular(venta: Venta): void {
    this.ventaToAnular = venta;
    this.showAnularModal = true;
  }

  cancelarAnular(): void {
    this.ventaToAnular = null;
    this.showAnularModal = false;
  }

  ejecutarAnulacion(): void {
    if (!this.ventaToAnular || !this.ventaToAnular.idVenta) return;

    this.anularLoading = true;
    this.ventaService.anular(this.ventaToAnular.idVenta).subscribe({
      next: (actualizada) => {
        this.anularLoading = false;
        this.cancelarAnular();
        this.notificar(`Venta #${actualizada.idVenta} anulada con éxito. El inventario ha sido restablecido.`);
        this.cargarVentas();
      },
      error: (err) => {
        this.anularLoading = false;
        this.errorMessage = getErrorMessage(err, 'Error al anular la venta.');
        this.cancelarAnular();
      }
    });
  }

  private notificar(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      this.successMessage = '';
    }, 4500);
  }
}
