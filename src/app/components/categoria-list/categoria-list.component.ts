import { getErrorMessage } from '../../services/api-error';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { Categoria } from '../../models/categoria.model';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-categoria-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categoria-list.component.html',
  styleUrls: ['./categoria-list.component.css']
})
export class CategoriaListComponent implements OnInit {
  categorias: Categoria[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Modal State
  showModal = false;
  isEditMode = false;
  selectedId: number | null = null;
  formNombre = '';
  formDescripcion = '';
  formError = '';

  // Delete State
  showDeleteModal = false;
  categoriaToDelete: Categoria | null = null;

  categoriaService = inject(CategoriaService);
  authService = inject(AuthService);

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = getErrorMessage(err, 'Error al cargar las categorías.');
      }
    });
  }

  abrirModalNuevo(): void {
    this.isEditMode = false;
    this.selectedId = null;
    this.formNombre = '';
    this.formDescripcion = '';
    this.formError = '';
    this.showModal = true;
  }

  abrirModalEditar(cat: Categoria): void {
    this.isEditMode = true;
    this.selectedId = cat.idCategoria ?? null;
    this.formNombre = cat.nombre;
    this.formDescripcion = cat.descripcion || '';
    this.formError = '';
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  guardarCategoria(): void {
    if (!this.formNombre.trim()) {
      this.formError = 'El nombre de la categoría es obligatorio';
      return;
    }

    const payload: Categoria = {
      nombre: this.formNombre.trim(),
      descripcion: this.formDescripcion.trim()
    };

    if (this.isEditMode && this.selectedId) {
      this.categoriaService.actualizar(this.selectedId, payload).subscribe({
        next: () => {
          this.notificar('Categoría actualizada con éxito');
          this.cerrarModal();
          this.cargarCategorias();
        },
        error: (err) => {
          this.formError = getErrorMessage(err, 'Error al actualizar categoría');
        }
      });
    } else {
      this.categoriaService.crear(payload).subscribe({
        next: () => {
          this.notificar('Categoría registrada con éxito');
          this.cerrarModal();
          this.cargarCategorias();
        },
        error: (err) => {
          this.formError = getErrorMessage(err, 'Error al crear categoría');
        }
      });
    }
  }

  confirmarEliminar(cat: Categoria): void {
    this.categoriaToDelete = cat;
    this.showDeleteModal = true;
  }

  cancelarEliminar(): void {
    this.categoriaToDelete = null;
    this.showDeleteModal = false;
  }

  eliminarCategoria(): void {
    if (!this.categoriaToDelete?.idCategoria) return;

    this.categoriaService.eliminar(this.categoriaToDelete.idCategoria).subscribe({
      next: () => {
        this.notificar('Categoría eliminada con éxito');
        this.cancelarEliminar();
        this.cargarCategorias();
      },
      error: (err) => {
        this.errorMessage = getErrorMessage(err, 'Error al eliminar la categoría');
        this.cancelarEliminar();
      }
    });
  }

  private notificar(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      this.successMessage = '';
    }, 3500);
  }
}
