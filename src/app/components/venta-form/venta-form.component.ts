import { getErrorMessage } from '../../services/api-error';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { VentaService } from '../../services/venta.service';
import { Producto } from '../../models/producto.model';
import { VentaRequest } from '../../models/venta.model';

interface CartItem {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-venta-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './venta-form.component.html',
  styleUrls: ['./venta-form.component.css']
})
export class VentaFormComponent implements OnInit {
  productos: Producto[] = [];
  isLoadingProductos = false;

  // Selection form
  selectedProductoId: number | null = null;
  selectedProducto: Producto | null = null;
  inputCantidad: number = 1;

  // Cart
  cart: CartItem[] = [];
  isSubmitting = false;

  // Messages
  formError = '';
  errorMessage = '';
  successMessage = '';

  productoService = inject(ProductoService);
  ventaService = inject(VentaService);
  router = inject(Router);

  ngOnInit(): void {
    this.cargarProductos();
  }

  getProductoId(p: Producto): number {
    return p.idProducto;
  }

  cargarProductos(): void {
    this.isLoadingProductos = true;
    this.productoService.listar().subscribe({
      next: (data) => {
        // Solo productos activos con stock > 0
        this.productos = data.filter(p => (p.estado !== false) && p.stock > 0);
        this.isLoadingProductos = false;
      },
      error: () => {
        this.isLoadingProductos = false;
        this.errorMessage = 'Error al cargar el catálogo de productos disponibles.';
      }
    });
  }

  onSelectProducto(): void {
    this.formError = '';
    if (!this.selectedProductoId) {
      this.selectedProducto = null;
      return;
    }
    this.selectedProducto = this.productos.find(p => this.getProductoId(p) == this.selectedProductoId) || null;
    this.inputCantidad = 1;
  }

  agregarAlCarrito(): void {
    this.formError = '';
    if (!this.selectedProducto) {
      this.formError = 'Seleccione un producto.';
      return;
    }

    if (!Number.isInteger(this.inputCantidad) || this.inputCantidad <= 0) {
      this.formError = 'La cantidad debe ser un número entero mayor a 0.';
      return;
    }

    const prodId = this.getProductoId(this.selectedProducto);
    const itemExistente = this.cart.find(item => this.getProductoId(item.producto) === prodId);
    const cantidadActualEnCarrito = itemExistente ? itemExistente.cantidad : 0;
    const nuevaCantidad = cantidadActualEnCarrito + this.inputCantidad;

    if (nuevaCantidad > this.selectedProducto.stock) {
      this.formError = `Stock insuficiente. Solo quedan ${this.selectedProducto.stock} unidades de "${this.selectedProducto.nombre}" (ya tienes ${cantidadActualEnCarrito} en el carrito).`;
      return;
    }

    if (itemExistente) {
      itemExistente.cantidad = nuevaCantidad;
      itemExistente.subtotal = itemExistente.cantidad * itemExistente.producto.precio;
    } else {
      this.cart.push({
        producto: this.selectedProducto,
        cantidad: this.inputCantidad,
        subtotal: this.inputCantidad * this.selectedProducto.precio
      });
    }

    // Reset selection
    this.selectedProductoId = null;
    this.selectedProducto = null;
    this.inputCantidad = 1;
  }

  eliminarDelCarrito(index: number): void {
    this.cart.splice(index, 1);
  }

  actualizarCantidad(item: CartItem, delta: number): void {
    const nueva = item.cantidad + delta;
    if (nueva <= 0) {
      return;
    }
    if (nueva > item.producto.stock) {
      this.formError = `No puedes superar el stock disponible (${item.producto.stock}) de ${item.producto.nombre}.`;
      return;
    }
    this.formError = '';
    item.cantidad = nueva;
    item.subtotal = item.cantidad * item.producto.precio;
  }

  calcularTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.subtotal, 0);
  }

  confirmarVenta(): void {
    if (this.isSubmitting) return;
    this.errorMessage = '';
    this.formError = '';

    if (this.cart.length === 0) {
      this.formError = 'El carrito de ventas está vacío. Agregue productos antes de confirmar.';
      return;
    }

    const payload: VentaRequest = {
      detalles: this.cart.map(item => ({
        idProducto: this.getProductoId(item.producto),
        cantidad: item.cantidad
      }))
    };

    this.isSubmitting = true;
    this.ventaService.registrar(payload).subscribe({
      next: (ventaCreada) => {
        this.isSubmitting = false;
        this.successMessage = `¡Venta #${ventaCreada.idVenta} registrada con éxito por un total de S/ ${ventaCreada.total}!`;
        this.cart = [];
        setTimeout(() => {
          this.router.navigate(['/ventas']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = getErrorMessage(err, 'Error al procesar la venta. Verifique el stock disponible.');
      }
    });
  }
}
