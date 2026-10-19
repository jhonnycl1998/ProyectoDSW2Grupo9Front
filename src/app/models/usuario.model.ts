export interface Persona {
  idPersona?: number;
  nombres: string;
  apellidos: string;
  dni: string;
  correo?: string | null;
  telefono?: string | null;
}

export interface Usuario {
  idUsuario: number;
  username: string;
  estado: boolean;
  persona: Persona;
  idRol: number;
  nombreRol: string;
}

export interface UsuarioRequest {
  username: string;
  password?: string;
  persona: Persona;
  idRol: number;
  estado?: boolean;
}
