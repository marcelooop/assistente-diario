import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { API_URL, paraNumero } from '../api.config';
import { authGuard, perfilCompletoGuard, visitanteGuard } from './auth.guards';
import { authInterceptor } from './auth.interceptor';
import { AuthResponse, AuthService } from './auth.service';

const RESPOSTA: AuthResponse = {
  token: 'abc', email: 'a@a.com', nome: 'Ana Souza', nomeUsuario: 'ana', perfilCompleto: true
};

describe('autenticação', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()]
    });
  });

  afterEach(() => localStorage.clear());

  it('login guarda a sessão e o destino depende do perfil', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.logado()).toBe(false);
    expect(auth.destinoPosLogin({ ...RESPOSTA, perfilCompleto: false })).toBe('/meus-dados');
    expect(auth.destinoPosLogin(RESPOSTA)).toBe('/visao-geral');

    auth.login('a@a.com', 'senha-123').subscribe();
    TestBed.inject(HttpTestingController).expectOne(`${API_URL}/auth/login`).flush(RESPOSTA);

    expect(auth.logado()).toBe(true);
    expect(auth.nomeUsuario()).toBe('ana');
    expect(localStorage.getItem('assistente.token')).toBe('abc');
  });

  it('registrar envia nome, nome de usuário, e-mail e senha', () => {
    TestBed.inject(AuthService).registrar('Ana Souza', 'ana', 'a@a.com', 'senha-123').subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(`${API_URL}/auth/registrar`);
    expect(req.request.body).toEqual({ nome: 'Ana Souza', nomeUsuario: 'ana', email: 'a@a.com', senha: 'senha-123' });
    req.flush({ ...RESPOSTA, perfilCompleto: false });
  });

  it('sair limpa a sessão e volta ao login', () => {
    const auth = TestBed.inject(AuthService);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    auth.login('a@a.com', 'x').subscribe();
    TestBed.inject(HttpTestingController).expectOne(`${API_URL}/auth/login`).flush(RESPOSTA);

    auth.sair();

    expect(auth.logado()).toBe(false);
    expect(localStorage.getItem('assistente.token')).toBeNull();
    expect(navegar).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('interceptor envia o token só para a nossa API', () => {
    TestBed.inject(AuthService).token.set('abc');
    const http = TestBed.inject(HttpTestingController);
    const cliente = TestBed.inject(HttpClient);

    cliente.get(`${API_URL}/perfil`).subscribe();
    expect(http.expectOne(`${API_URL}/perfil`).request.headers.get('Authorization')).toBe('Bearer abc');

    cliente.get('https://outro-site.com/x').subscribe();
    expect(http.expectOne('https://outro-site.com/x').request.headers.has('Authorization')).toBe(false);
  });

  it('interceptor desloga quando a API recusa a sessão (401)', () => {
    const auth = TestBed.inject(AuthService);
    auth.token.set('abc');
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    TestBed.inject(HttpClient).get(`${API_URL}/perfil`).subscribe({ error: () => undefined });
    TestBed.inject(HttpTestingController)
      .expectOne(`${API_URL}/perfil`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logado()).toBe(false);
  });

  it('guards: visitante vai ao login, logado vai à visão geral', () => {
    const auth = TestBed.inject(AuthService);
    const rota = {} as never;
    const estado = {} as never;

    const semSessao = TestBed.runInInjectionContext(() => authGuard(rota, estado));
    expect(String(semSessao)).toBe('/login');
    expect(TestBed.runInInjectionContext(() => visitanteGuard(rota, estado))).toBe(true);

    auth.token.set('abc');
    expect(TestBed.runInInjectionContext(() => authGuard(rota, estado))).toBe(true);
    expect(String(TestBed.runInInjectionContext(() => visitanteGuard(rota, estado)))).toBe('/visao-geral');
  });

  it('guard da visão geral manda usuário sem medidas (404) para /meus-dados', async () => {
    const http = TestBed.inject(HttpTestingController);
    const resultado = TestBed.runInInjectionContext(() => perfilCompletoGuard({} as never, {} as never));
    const promessa = firstValueFrom(resultado as never);
    http.expectOne(`${API_URL}/perfil`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(String(await promessa)).toBe('/meus-dados');
  });

  it('guard da visão geral libera quem já tem medidas', async () => {
    const http = TestBed.inject(HttpTestingController);
    const resultado = TestBed.runInInjectionContext(() => perfilCompletoGuard({} as never, {} as never));
    const promessa = firstValueFrom(resultado as never);
    http.expectOne(`${API_URL}/perfil`).flush({ id: 1 });
    expect(await promessa).toBe(true);
  });
});

describe('paraNumero', () => {
  it('converte texto do ion-input em número e vazio em null', () => {
    expect(paraNumero('1.75')).toBe(1.75);
    expect(paraNumero(70)).toBe(70);
    expect(paraNumero('')).toBeNull();
    expect(paraNumero(null)).toBeNull();
  });
});
