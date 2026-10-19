export interface Producto {
  idProducto: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  estado?: boolean;
  idCategoria: number;
  nombreCategoria?: string;
  usernameRegistro?: string;
}

export interface ProductoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  idCategoria: number;
}
