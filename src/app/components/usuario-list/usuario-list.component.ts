import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario, UsuarioRequest } from '../../models/usuario.model';
import { Rol } from '../../models/rol.model';
import { UsuarioService } from '../../services/usuario.service';
import { RolService } from '../../services/rol.service';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../services/api-error';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['../rol-list/rol-list.component.css', './usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly rolService = inject(RolService);
  readonly authService = inject(AuthService);

  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  showModal = false;
  isEditMode = false;
  selectedId: number | null = null;
  formError = '';
  form = this.formVacio();
  showDeleteModal = false;
  usuarioToDelete: Usuario | null = null;

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarRoles();
  }

  private formVacio() {
    return {
      username: '',
      password: '',
      nombres: '',
      apellidos: '',
      dni: '',
      correo: '',
      telefono: '',
      idRol: null as number | null
    };
  }

  cargarUsuarios(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Error al cargar los usuarios.');
        this.isLoading = false;
      }
    });
  }

  cargarRoles(): void {
    this.rolService.listar().subscribe({
      next: (data) => {
        this.roles = data.filter(rol =>
          (rol.nombre === 'ADMIN' || rol.nombre === 'VENDEDOR') && rol.idRol != null
        );
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Error al cargar los roles.');
      }
    });
  }

  abrirModalNuevo(): void {
    this.isEditMode = false;
    this.selectedId = null;
    this.form = this.formVacio();
    this.form.idRol = this.roles.find(rol => rol.nombre === 'VENDEDOR')?.idRol ?? this.roles[0]?.idRol ?? null;
    this.formError = '';
    this.showModal = true;
  }

  abrirModalEditar(usuario: Usuario): void {
    this.isEditMode = true;
    this.selectedId = usuario.idUsuario;
    this.form = {
      username: usuario.username,
      password: '',
      nombres: usuario.persona.nombres,
      apellidos: usuario.persona.apellidos,
      dni: usuario.persona.dni,
      correo: usuario.persona.correo ?? '',
      telefono: usuario.persona.telefono ?? '',
      idRol: usuario.idRol
    };
    this.formError = '';
    this.showModal = true;
  }

  cerrarModal(): void {
    if (this.isSaving) return;
    this.showModal = false;
  }

  guardarUsuario(): void {
    if (this.isSaving) return;
    const username = this.form.username.trim();
    const password = this.form.password;
    const nombres = this.form.nombres.trim();
    const apellidos = this.form.apellidos.trim();
    const dni = this.form.dni.trim();
    const correo = this.form.correo.trim();
    const telefono = this.form.telefono.trim();
    const idRol = this.form.idRol;

    if (!username || username.length > 50) {
      this.formError = 'El usuario debe tener entre 1 y 50 caracteres.';
      return;
    }
    if ((!this.isEditMode || password.length > 0) && (password.length < 6 || password.length > 50)) {
      this.formError = 'La contraseña debe tener entre 6 y 50 caracteres.';
      return;
    }
    if (!nombres || nombres.length > 80 || !apellidos || apellidos.length > 80) {
      this.formError = 'Ingrese nombres y apellidos de máximo 80 caracteres.';
      return;
    }
    if (!/^\d{8}$/.test(dni)) {
      this.formError = 'El DNI debe tener 8 dígitos.';
      return;
    }
    if (correo.length > 100 || (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))) {
      this.formError = 'Ingrese un correo válido de máximo 100 caracteres.';
      return;
    }
    if (telefono.length > 15) {
      this.formError = 'El teléfono no puede superar los 15 caracteres.';
      return;
    }
    if (idRol == null || !this.roles.some(rol => rol.idRol === idRol)) {
      this.formError = 'Seleccione un rol válido.';
      return;
    }

    const payload: UsuarioRequest = {
      username,
      persona: { nombres, apellidos, dni, correo, telefono },
      idRol
    };
    if (password) payload.password = password;

    this.formError = '';
    this.isSaving = true;
    const request = this.isEditMode && this.selectedId !== null
      ? this.usuarioService.actualizar(this.selectedId, payload)
      : this.usuarioService.registrar(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.showModal = false;
        this.successMessage = this.isEditMode ? 'Usuario actualizado correctamente.' : 'Usuario registrado correctamente.';
        this.cargarUsuarios();
      },
      error: (error) => {
        this.isSaving = false;
        this.formError = getErrorMessage(error, 'No se pudo guardar el usuario.');
      }
    });
  }

  confirmarEliminar(usuario: Usuario): void {
    this.usuarioToDelete = usuario;
    this.showDeleteModal = true;
  }

  cancelarEliminar(): void {
    if (this.isSaving) return;
    this.usuarioToDelete = null;
    this.showDeleteModal = false;
  }

  eliminarUsuario(): void {
    if (!this.usuarioToDelete || this.isSaving) return;
    this.isSaving = true;
    this.usuarioService.eliminar(this.usuarioToDelete.idUsuario).subscribe({
      next: () => {
        this.isSaving = false;
        this.cancelarEliminar();
        this.successMessage = 'Usuario desactivado correctamente.';
        this.cargarUsuarios();
      },
      error: (error) => {
        this.isSaving = false;
        this.cancelarEliminar();
        this.errorMessage = getErrorMessage(error, 'No se pudo desactivar el usuario.');
      }
    });
  }

  esUsuarioActual(usuario: Usuario): boolean {
    return this.authService.currentUser()?.username === usuario.username;
  }
}
