import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { jwtInterceptor } from '../interceptors/jwt.interceptor';

describe('Session handling', () => {
  let http: HttpTestingController;
  const token = (seconds: number) => `header.${btoa(JSON.stringify({exp: Math.floor(Date.now() / 1000) + seconds}))}.signature`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({providers: [
      provideRouter([]), provideHttpClient(withInterceptors([jwtInterceptor])), provideHttpClientTesting()
    ]});
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('discards expired tokens and malformed stored sessions', () => {
    localStorage.setItem('almacen_jwt_token', token(-10));
    localStorage.setItem('almacen_user_session', '{invalid');
    const auth = TestBed.inject(AuthService);
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('almacen_jwt_token')).toBeNull();
  });

  it('attaches the token and signs out when the API rejects the session', () => {
    const auth = TestBed.inject(AuthService);
    const session = {username: 'admin', rol: 'ADMIN', token: token(60)};
    auth.login({username: 'admin', password: 'test'}).subscribe();
    const login = http.expectOne('http://localhost:8080/api/auth/login');
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush(session);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.inject(HttpClient).get('http://localhost:8080/api/productos').subscribe({error: () => {}});
    const request = http.expectOne('http://localhost:8080/api/productos');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${session.token}`);
    request.flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(auth.isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
