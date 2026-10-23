import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { PessoaForm } from './pessoa-form';

const API = 'http://localhost:8080/api';
const CONTA = { nome: 'Ana Souza', nomeUsuario: 'ana', email: 'ana@teste.com' };
const MEDIDAS = {
  id: 1, altura: 1.6, peso: 80, metaPeso: 65, imc: 31.25,
  classificacaoImc: 'Obesidade grau I', massaMagra: null, massaGorda: null
};
const NAO_ENCONTRADO = { status: 404, statusText: 'Not Found' };

describe('PessoaForm', () => {
  let http: HttpTestingController;

  /** Cria o formulário; a sessão já guarda os dados da conta, como após o login. */
  function criar() {
    TestBed.configureTestingModule({
      imports: [PessoaForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    const auth = TestBed.inject(AuthService);
    auth.definirConta(CONTA);
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PessoaForm);
    fixture.detectChanges();
    return fixture;
  }

  function carregar(fixture: ReturnType<typeof criar>, medidas: object | null) {
    http.expectOne({ method: 'GET', url: `${API}/conta` }).flush(CONTA);
    const req = http.expectOne({ method: 'GET', url: `${API}/perfil` });
    medidas ? req.flush(medidas) : req.flush(null, NAO_ENCONTRADO);
    fixture.detectChanges();
  }

  const form = (f: ReturnType<typeof criar>) => (f.componentInstance as any).form;
  const salvar = (f: ReturnType<typeof criar>) => (f.componentInstance as any).salvar();

  afterEach(() => localStorage.clear());

  it('calcula o IMC automaticamente a partir de peso e altura', () => {
    const fixture = criar();
    form(fixture).patchValue({ altura: 1.75, peso: 70 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.imc strong').textContent).toContain('22.86');
    expect(fixture.nativeElement.querySelector('.imc em').textContent).toContain('Peso normal');
  });

  it('usuário novo vê os dados do cadastro preenchidos; massas são opcionais', () => {
    const fixture = criar();
    carregar(fixture, null);

    expect(form(fixture).value).toEqual(jasmine.objectContaining(CONTA));
    expect(form(fixture).valid).toBeFalse();

    form(fixture).patchValue({ altura: 1.75, peso: 70, metaPeso: 68 });
    expect(form(fixture).valid).toBeTrue();
  });

  it('usuário com cadastro vê conta e medidas e salva as medidas com PUT, sem tocar na conta', () => {
    const fixture = criar();
    carregar(fixture, MEDIDAS);
    expect(form(fixture).value.nome).toBe('Ana Souza');
    expect(form(fixture).value.peso).toBe(80);

    salvar(fixture);
    http.expectNone({ method: 'PUT', url: `${API}/conta` });
    http.expectOne({ method: 'PUT', url: `${API}/perfil` }).flush(MEDIDAS);
  });

  it('usuário novo cria as medidas com POST (null nas massas, sem IMC, sem nome) e vai à visão geral', () => {
    const fixture = criar();
    carregar(fixture, null);
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl');
    form(fixture).patchValue({ altura: 1.75, peso: 70, metaPeso: 68 });

    salvar(fixture);

    const req = http.expectOne({ method: 'POST', url: `${API}/perfil` });
    expect(req.request.body).toEqual({
      altura: 1.75, peso: 70, metaPeso: 68, massaMagra: null, massaGorda: null
    });
    req.flush(MEDIDAS);
    expect(navegar).toHaveBeenCalledWith('/visao-geral');
  });

  it('alterar o cadastro salva a conta primeiro e atualiza o "Olá" do menu', () => {
    const fixture = criar();
    carregar(fixture, MEDIDAS);
    form(fixture).patchValue({ nomeUsuario: 'ana2', email: 'Ana@Teste.com' });

    salvar(fixture);

    const conta = http.expectOne({ method: 'PUT', url: `${API}/conta` });
    expect(conta.request.body).toEqual({ nome: 'Ana Souza', nomeUsuario: 'ana2', email: 'Ana@Teste.com' });
    http.expectNone({ method: 'PUT', url: `${API}/perfil` });

    conta.flush({ nome: 'Ana Souza', nomeUsuario: 'ana2', email: 'ana@teste.com' });
    expect(TestBed.inject(AuthService).nomeUsuario()).toBe('ana2');
    http.expectOne({ method: 'PUT', url: `${API}/perfil` }).flush(MEDIDAS);
  });

  it('mostra o erro do servidor e não salva as medidas se a conta for recusada', () => {
    const fixture = criar();
    carregar(fixture, MEDIDAS);
    form(fixture).patchValue({ nomeUsuario: 'em-uso' });

    salvar(fixture);
    http.expectOne({ method: 'PUT', url: `${API}/conta` })
      .flush({ detail: 'Este nome de usuario ja esta em uso.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    http.expectNone({ method: 'PUT', url: `${API}/perfil` });
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('ja esta em uso');
    expect(TestBed.inject(AuthService).nomeUsuario()).toBe('ana');
  });
});
