import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ProductoListComponent } from './components/producto-list/producto-list.component';
import { CategoriaListComponent } from './components/categoria-list/categoria-list.component';
import { RolListComponent } from './components/rol-list/rol-list.component';
import { UsuarioListComponent } from './components/usuario-list/usuario-list.component';
import { VentaListComponent } from './components/venta-list/venta-list.component';
import { VentaFormComponent } from './components/venta-form/venta-form.component';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'productos', component: ProductoListComponent, canActivate: [authGuard] },
  { path: 'categorias', component: CategoriaListComponent, canActivate: [authGuard] },
  { path: 'roles', component: RolListComponent, canActivate: [authGuard, adminGuard] },
  { path: 'usuarios', component: UsuarioListComponent, canActivate: [authGuard, adminGuard] },
  { path: 'ventas', component: VentaListComponent, canActivate: [authGuard] },
  { path: 'ventas/nueva', component: VentaFormComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'productos', pathMatch: 'full' },
  { path: '**', redirectTo: 'productos' }
];
