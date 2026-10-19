import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { ProductoListComponent } from './producto-list.component';
import { CategoriaListComponent } from '../categoria-list/categoria-list.component';
import { Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto.service';

describe('Catalog contracts', () => {
  let http: HttpTestingController;
  const producto: Producto = {
    idProducto: 7, codigo: 'P007', nombre: 'Mouse', descripcion: 'USB',
    precio: 25, stock: 4, idCategoria: 3, nombreCategoria: 'Periféricos'
  };

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('creates a product with the required code and category ID', () => {
    const component = TestBed.runInInjectionContext(() => new ProductoListComponent());
    component.categorias = [{idCategoria: 3, nombre: 'Periféricos'}];
    component.abrirModalNuevo();
    component.formCodigo = ' P007 ';
    component.formNombre = 'Mouse';
    component.formPrecio = 25;
    component.formStock = 4;
    component.guardarProducto();
    const request = http.expectOne('http://localhost:8080/api/productos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({codigo: 'P007', nombre: 'Mouse', descripcion: '', precio: 25, stock: 4, idCategoria: 3});
    request.flush(producto);
    http.expectOne('http://localhost:8080/api/productos').flush([producto]);
  });

  it('updates and deletes using idProducto instead of creating a duplicate', () => {
    const component = TestBed.runInInjectionContext(() => new ProductoListComponent());
    component.abrirModalEditar(producto);
    component.guardarProducto();
    const update = http.expectOne('http://localhost:8080/api/productos/7');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body.descripcion).toBe('USB');
    update.flush(producto);
    http.expectOne('http://localhost:8080/api/productos').flush([producto]);
    component.confirmarEliminar(producto);
    component.eliminarProducto();
    const remove = http.expectOne('http://localhost:8080/api/productos/7');
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
    http.expectOne('http://localhost:8080/api/productos').flush([]);
  });

  it('updates and deletes categories using idCategoria', () => {
    const component = TestBed.runInInjectionContext(() => new CategoriaListComponent());
    const category = {idCategoria: 3, nombre: 'Periféricos'};
    component.abrirModalEditar(category);
    component.guardarCategoria();
    const update = http.expectOne('http://localhost:8080/api/categorias/3');
    expect(update.request.method).toBe('PUT');
    update.flush(category);
    http.expectOne('http://localhost:8080/api/categorias').flush([category]);
    component.confirmarEliminar(category);
    component.eliminarCategoria();
    const remove = http.expectOne('http://localhost:8080/api/categorias/3');
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
    http.expectOne('http://localhost:8080/api/categorias').flush([]);
  });

  it('filters product names without depending on an unsupported API parameter', () => {
    let result: Producto[] = [];
    TestBed.inject(ProductoService).listar(' MOU ').subscribe(value => result = value);
    http.expectOne('http://localhost:8080/api/productos').flush([producto, {...producto, idProducto: 8, nombre: 'Teclado'}]);
    expect(result.map(value => value.idProducto)).toEqual([7]);
  });

  it('shows field validation errors returned by the API', () => {
    const component = TestBed.runInInjectionContext(() => new ProductoListComponent());
    component.abrirModalEditar(producto);
    component.guardarProducto();
    http.expectOne('http://localhost:8080/api/productos/7').flush(
      {mensaje: 'Datos inválidos', errores: {codigo: 'Código requerido'}},
      {status: 400, statusText: 'Bad Request'}
    );
    expect(component.formError).toBe('Código requerido');
  });
});
