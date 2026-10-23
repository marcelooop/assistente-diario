import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { authGuard, perfilCompletoGuard, visitanteGuard } from './auth.guards';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { Login } from './login';

const API = 'http://localhost:8080/api';

describe('autenticação', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()]
    });
  });

  afterEach(() => localStorage.clear());

  it('login guarda o token e indica o destino conforme o perfil', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.logado()).toBeFalse();
    expect(auth.destinoPosLogin({ token: 't', email: 'a@a.com', nome: 'Ana Souza', nomeUsuario: 'ana', perfilCompleto: false })).toBe('/perfil');
    expect(auth.destinoPosLogin({ token: 't', email: 'a@a.com', nome: 'Ana Souza', nomeUsuario: 'ana', perfilCompleto: true })).toBe('/visao-geral');

    auth.login('a@a.com', 'senha-123').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne(`${API}/auth/login`)
      .flush({ token: 'abc', email: 'a@a.com', nome: 'Ana Souza', nomeUsuario: 'ana', perfilCompleto: true });

    expect(auth.logado()).toBeTrue();
    expect(localStorage.getItem('assistente.token')).toBe('abc');
  });

  it('sair limpa a sessão e volta ao login', () => {
    const auth = TestBed.inject(AuthService);
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl');
    auth.login('a@a.com', 'x').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne(`${API}/auth/login`)
      .flush({ token: 'abc', email: 'a@a.com', nome: 'Ana Souza', nomeUsuario: 'ana', perfilCompleto: true });

    auth.sair();

    expect(auth.logado()).toBeFalse();
    expect(localStorage.getItem('assistente.token')).toBeNull();
    expect(navegar).toHaveBeenCalledWith('/login');
  });

  it('interceptor envia o token só para a nossa API', () => {
    TestBed.inject(AuthService).token.set('abc');
    const http = TestBed.inject(HttpTestingController);
    const cliente = TestBed.inject(HttpClient);

    cliente.get(`${API}/perfil`).subscribe();
    expect(http.expectOne(`${API}/perfil`).request.headers.get('Authorization')).toBe('Bearer abc');

    cliente.get('https://outro-site.com/x').subscribe();
    expect(http.expectOne('https://outro-site.com/x').request.headers.has('Authorization')).toBeFalse();
  });

  it('interceptor desloga quando a API recusa a sessão (401)', () => {
    const auth = TestBed.inject(AuthService);
    auth.token.set('abc');
    spyOn(TestBed.inject(Router), 'navigateByUrl');
    TestBed.inject(HttpClient).get(`${API}/perfil`).subscribe({ error: () => {} });
    TestBed.inject(HttpTestingController)
      .expectOne(`${API}/perfil`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logado()).toBeFalse();
  });

  it('guards: visitante vai ao login, logado vai à visão geral', () => {
    const auth = TestBed.inject(AuthService);
    const rota = {} as never;
    const estado = {} as never;

    const semSessao = TestBed.runInInjectionContext(() => authGuard(rota, estado));
    expect(semSessao.toString()).toBe('/login');
    expect(TestBed.runInInjectionContext(() => visitanteGuard(rota, estado))).toBeTrue();

    auth.token.set('abc');
    expect(TestBed.runInInjectionContext(() => authGuard(rota, estado))).toBeTrue();
    expect(TestBed.runInInjectionContext(() => visitanteGuard(rota, estado)).toString()).toBe('/visao-geral');
  });

  it('guard da visão geral manda usuário sem cadastro (404) para /perfil', async () => {
    const http = TestBed.inject(HttpTestingController);
    const resultado = TestBed.runInInjectionContext(() => perfilCompletoGuard({} as never, {} as never));
    const promessa = firstValueFrom(resultado as never);
    http.expectOne(`${API}/perfil`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(String(await promessa)).toBe('/perfil');
  });

  it('guard da visão geral libera quem já tem cadastro', async () => {
    const http = TestBed.inject(HttpTestingController);
    const resultado = TestBed.runInInjectionContext(() => perfilCompletoGuard({} as never, {} as never));
    const promessa = firstValueFrom(resultado as never);
    http.expectOne(`${API}/perfil`).flush({ id: 1 });
    expect(await promessa).toBeTrue();
  });
});

describe('Login', () => {
  it('não envia formulário inválido', () => {
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    (fixture.componentInstance as any).entrar();
    TestBed.inject(HttpTestingController).expectNone(`${API}/auth/login`);
  });
});


