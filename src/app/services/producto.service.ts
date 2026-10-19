import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Producto, ProductoRequest } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:8080/v1/api/productos';

  constructor(private http: HttpClient) {}

  listar(nombre?: string): Observable<Producto[]> {
    const filtro = nombre?.trim().toLocaleLowerCase() || '';
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      map(productos => productos.filter(producto => producto.nombre.toLocaleLowerCase().includes(filtro)))
    );
  }

  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  crear(request: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, request);
  }

  actualizar(id: number, request: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
