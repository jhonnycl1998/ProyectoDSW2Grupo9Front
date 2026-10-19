export interface DetalleVenta {
  idDetalle?: number;
  idProducto: number;
  nombreProducto?: string;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
}

export interface Venta {
  idVenta?: number;
  fecha?: string;
  total?: number;
  username?: string;
  estado?: string;
  detalles: DetalleVenta[];
}

export interface VentaRequest {
  detalles: {
    idProducto: number;
    cantidad: number;
  }[];
}
