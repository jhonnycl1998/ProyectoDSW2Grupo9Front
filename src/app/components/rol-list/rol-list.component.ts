import { getErrorMessage } from '../../services/api-error';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolService } from '../../services/rol.service';
import { AuthService } from '../../services/auth.service';
import { Rol } from '../../models/rol.model';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-rol-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rol-list.component.html',
  styleUrls: ['./rol-list.component.css']
})
export class RolListComponent implements OnInit {
  roles: Rol[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Modal State
  showModal = false;
  isEditMode = false;
  selectedId: number | null = null;
  formNombre = '';
  formError = '';

  // Delete Modal State
  showDeleteModal = false;
  rolToDelete: Rol | null = null;

  rolService = inject(RolService);
  authService = inject(AuthService);

  ngOnInit(): void {
    this.cargarRoles();
  }

  getRolId(rol: Rol): number | null {
    return rol.idRol ?? rol.id ?? null;
  }

  isSystemRole(nombre: string): boolean {
    const n = (nombre || '').toUpperCase();
    return n === 'ADMIN' || n === 'VENDEDOR';
  }

  cargarRoles(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.rolService.listar().subscribe({
      next: (data) => {
        this.roles = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = getErrorMessage(err, 'Error al cargar los roles.');
      }
    });
  }

  abrirModalNuevo(): void {
    this.isEditMode = false;
    this.selectedId = null;
    this.formNombre = '';
    this.formError = '';
    this.showModal = true;
  }

  abrirModalEditar(rol: Rol): void {
    this.isEditMode = true;
    this.selectedId = this.getRolId(rol);
    this.formNombre = rol.nombre;
    this.formError = '';
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  guardarRol(): void {
    const nombre = this.formNombre.trim().toUpperCase();
    if (!nombre) {
      this.formError = 'El nombre del rol es obligatorio.';
      return;
    }

    const payload: Rol = { nombre };

    if (this.isEditMode && this.selectedId) {
      this.rolService.actualizar(this.selectedId, payload).subscribe({
        next: () => {
          this.notificar('Rol actualizado con éxito');
          this.cerrarModal();
          this.cargarRoles();
        },
        error: (err) => {
          this.formError = getErrorMessage(err, 'Error al actualizar el rol');
        }
      });
    } else {
      this.rolService.crear(payload).subscribe({
        next: () => {
          this.notificar('Rol registrado con éxito');
          this.cerrarModal();
          this.cargarRoles();
        },
        error: (err) => {
          this.formError = getErrorMessage(err, 'Error al crear el rol');
        }
      });
    }
  }

  confirmarEliminar(rol: Rol): void {
    this.rolToDelete = rol;
    this.showDeleteModal = true;
  }

  cancelarEliminar(): void {
    this.rolToDelete = null;
    this.showDeleteModal = false;
  }

  eliminarRol(): void {
    if (!this.rolToDelete) return;
    const id = this.getRolId(this.rolToDelete);
    if (!id) return;

    this.rolService.eliminar(id).subscribe({
      next: () => {
        this.notificar('Rol eliminado con éxito');
        this.cancelarEliminar();
        this.cargarRoles();
      },
      error: (err) => {
        this.errorMessage = getErrorMessage(err, 'Error al eliminar el rol');
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
