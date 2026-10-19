import { getErrorMessage } from '../../services/api-error';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { Producto, ProductoRequest } from '../../models/producto.model';
import { Categoria } from '../../models/categoria.model';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-producto-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-list.component.html',
  styleUrls: ['./producto-list.component.css']
})
export class ProductoListComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Modal State
  showModal = false;
  isEditMode = false;
  selectedProductoId: number | null = null;

  // Form Model
  formCodigo = '';
  formNombre = '';
  formDescripcion = '';
  formPrecio: number | null = null;
  formStock: number | null = null;
  formCategoriaId: number | null = null;
  formError = '';

  // Delete Confirm Modal State
  showDeleteModal = false;
  productoToDelete: Producto | null = null;

  productoService = inject(ProductoService);
  categoriaService = inject(CategoriaService);
  authService = inject(AuthService);

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias();
  }

  cargarProductos(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.productoService.listar(this.searchTerm).subscribe({
      next: (data) => {
        this.productos = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = getErrorMessage(err, 'Error al cargar los productos.');
      }
    });
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (err) => {
        console.error('Error al cargar categorías', err);
      }
    });
  }

  onSearch(): void {
    this.cargarProductos();
  }

  abrirModalNuevo(): void {
    this.isEditMode = false;
    this.selectedProductoId = null;
    this.formCodigo = '';
    this.formNombre = '';
    this.formDescripcion = '';
    this.formPrecio = null;
    this.formStock = null;
    this.formCategoriaId = this.categorias[0]?.idCategoria ?? null;
    this.formError = '';
    this.showModal = true;
  }

  abrirModalEditar(prod: Producto): void {
    this.isEditMode = true;
    this.selectedProductoId = prod.idProducto;
    this.formCodigo = prod.codigo;
    this.formNombre = prod.nombre;
    this.formDescripcion = prod.descripcion || '';
    this.formPrecio = prod.precio;
    this.formStock = prod.stock;
    this.formCategoriaId = prod.idCategoria;
    this.formError = '';
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  guardarProducto(): void {
    if (!this.formCodigo.trim() || this.formCodigo.trim().length > 30) {
      this.formError = 'El código es obligatorio y debe tener como máximo 30 caracteres';
      return;
    }
    if (!this.formNombre.trim()) {
      this.formError = 'El nombre del producto es obligatorio';
      return;
    }
    if (this.formPrecio === null || !Number.isFinite(this.formPrecio) || this.formPrecio <= 0) {
      this.formError = 'El precio debe ser un número válido mayor a 0';
      return;
    }
    if (this.formPrecio > 99999999.99 || Number(this.formPrecio.toFixed(2)) !== this.formPrecio) {
      this.formError = 'El precio debe tener como máximo 8 dígitos enteros y 2 decimales';
      return;
    }
    if (this.formStock === null || !Number.isInteger(this.formStock) || this.formStock < 0 || this.formStock > 2147483647) {
      this.formError = 'El stock debe ser un número entero entre 0 y 2147483647';
      return;
    }
    if (!this.formCategoriaId) {
      this.formError = 'Debe seleccionar una categoría';
      return;
    }

    const payload: ProductoRequest = {
      codigo: this.formCodigo.trim(),
      nombre: this.formNombre.trim(),
      descripcion: this.formDescripcion.trim(),
      precio: Number(this.formPrecio),
      stock: Number(this.formStock),
      idCategoria: Number(this.formCategoriaId)
    };

    if (this.isEditMode && this.selectedProductoId) {
      this.productoService.actualizar(this.selectedProductoId, payload).subscribe({
        next: () => {
          this.mostrarNotificacion('Producto actualizado correctamente');
          this.cerrarModal();
          this.cargarProductos();
        },
        error: (err) => {
          this.formError = getErrorMessage(err, 'Error al actualizar el producto');
        }
      });
    } else {
      this.productoService.crear(payload).subscribe({
        next: () => {
          this.mostrarNotificacion('Producto registrado correctamente');
          this.cerrarModal();
          this.cargarProductos();
        },
        error: (err) => {
          this.formError = getErrorMessage(err, 'Error al registrar el producto');
        }
      });
    }
  }

  confirmarEliminar(prod: Producto): void {
    this.productoToDelete = prod;
    this.showDeleteModal = true;
  }

  cancelarEliminar(): void {
    this.productoToDelete = null;
    this.showDeleteModal = false;
  }

  eliminarProducto(): void {
    if (!this.productoToDelete) return;

    this.productoService.eliminar(this.productoToDelete.idProducto).subscribe({
      next: () => {
        this.mostrarNotificacion('Producto eliminado con éxito');
        this.cancelarEliminar();
        this.cargarProductos();
      },
      error: (err) => {
        this.errorMessage = getErrorMessage(err, 'Error al eliminar el producto');
        this.cancelarEliminar();
      }
    });
  }

  private mostrarNotificacion(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      this.successMessage = '';
    }, 3500);
  }
}
