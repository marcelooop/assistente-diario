import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { API_URL } from '../core/api.config';
import { RegistroPage } from '../registro/registro.page';
import { LoginPage } from './login.page';

const providers = () => [provideRouter([]), provideIonicAngular(), provideHttpClient(), provideHttpClientTesting()];

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Router.prototype, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function criar() {
    TestBed.configureTestingModule({ imports: [LoginPage], providers: providers() });
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return { fixture, c: fixture.componentInstance as any, http: TestBed.inject(HttpTestingController) };
  }

  it('não envia formulário inválido', () => {
    const { c, http } = criar();
    c.entrar();
    http.expectNone(`${API_URL}/auth/login`);
  });

  it('usuário já cadastrado vai para a visão geral', () => {
    const { c, http } = criar();
    c.form.setValue({ email: 'ana@teste.com', senha: 'senha-123' });
    c.entrar();
    http.expectOne(`${API_URL}/auth/login`).flush({
      token: 't', email: 'ana@teste.com', nome: 'Ana', nomeUsuario: 'ana', perfilCompleto: true
    });
    expect(Router.prototype.navigateByUrl).toHaveBeenCalledWith('/visao-geral', { replaceUrl: true });
  });

  it('usuário novo (sem medidas) vai para Meus dados', () => {
    const { c, http } = criar();
    c.form.setValue({ email: 'ana@teste.com', senha: 'senha-123' });
    c.entrar();
    http.expectOne(`${API_URL}/auth/login`).flush({
      token: 't', email: 'ana@teste.com', nome: 'Ana', nomeUsuario: 'ana', perfilCompleto: false
    });
    expect(Router.prototype.navigateByUrl).toHaveBeenCalledWith('/meus-dados', { replaceUrl: true });
  });

  it('mostra a mensagem do servidor quando o login é recusado', () => {
    const { fixture, c, http } = criar();
    c.form.setValue({ email: 'ana@teste.com', senha: 'errada-123' });
    c.entrar();
    http.expectOne(`${API_URL}/auth/login`)
      .flush({ detail: 'E-mail ou senha invalidos.' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('invalidos');
    expect(Router.prototype.navigateByUrl).not.toHaveBeenCalled();
  });
});

describe('RegistroPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Router.prototype, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function criar() {
    TestBed.configureTestingModule({ imports: [RegistroPage], providers: providers() });
    const fixture = TestBed.createComponent(RegistroPage);
    fixture.detectChanges();
    return { c: fixture.componentInstance as any, http: TestBed.inject(HttpTestingController) };
  }

  const valido = {
    nome: ' Ana Souza ', nomeUsuario: 'ana.s', email: 'ana@teste.com', senha: 'senha-123', confirmacao: 'senha-123'
  };

  it('valida nome, nome de usuário, senha e confirmação', () => {
    const { c, http } = criar();
    c.form.setValue({ ...valido, nomeUsuario: 'a b' });
    expect(c.form.controls.nomeUsuario.invalid).toBe(true);
    c.form.setValue({ ...valido, senha: 'curta', confirmacao: 'curta' });
    expect(c.form.controls.senha.invalid).toBe(true);
    c.form.setValue({ ...valido, confirmacao: 'diferente-1' });
    expect(c.form.hasError('senhasDiferentes')).toBe(true);
    c.criar();
    http.expectNone(`${API_URL}/auth/registrar`);
  });

  it('cria a conta e segue para Meus dados', () => {
    const { c, http } = criar();
    c.form.setValue(valido);
    c.criar();

    const req = http.expectOne(`${API_URL}/auth/registrar`);
    expect(req.request.body).toEqual({
      nome: 'Ana Souza', nomeUsuario: 'ana.s', email: 'ana@teste.com', senha: 'senha-123'
    });
    req.flush({ token: 't', email: 'ana@teste.com', nome: 'Ana Souza', nomeUsuario: 'ana.s', perfilCompleto: false });
    expect(Router.prototype.navigateByUrl).toHaveBeenCalledWith('/meus-dados', { replaceUrl: true });
  });
});
