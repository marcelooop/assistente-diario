import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { API_URL } from '../core/api.config';
import { AuthService } from '../core/auth/auth.service';
import { MeusDadosPage } from './meus-dados.page';
import { TrocaSenhaComponent } from './troca-senha.component';

const CONTA = { nome: 'Ana Souza', nomeUsuario: 'ana', email: 'ana@teste.com' };
const MEDIDAS = {
  id: 1, altura: 1.6, peso: 80, metaPeso: 65, imc: 31.25,
  classificacaoImc: 'Obesidade grau I', massaMagra: null, massaGorda: null
};
const NAO_ENCONTRADO = { status: 404, statusText: 'Not Found' };

describe('MeusDadosPage', () => {
  let http: HttpTestingController;

  function criar() {
    TestBed.configureTestingModule({
      imports: [MeusDadosPage],
      providers: [provideRouter([]), provideIonicAngular(), provideHttpClient(), provideHttpClientTesting()]
    });
    TestBed.inject(AuthService).definirConta(CONTA);
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MeusDadosPage);
    fixture.detectChanges();
    return fixture;
  }

  function carregar(fixture: ReturnType<typeof criar>, medidas: object | null) {
    http.expectOne({ method: 'GET', url: `${API_URL}/conta` }).flush(CONTA);
    const req = http.expectOne({ method: 'GET', url: `${API_URL}/perfil` });
    if (medidas) {
      req.flush(medidas);
    } else {
      req.flush(null, NAO_ENCONTRADO);
    }
    fixture.detectChanges();
  }

  const pagina = (f: ReturnType<typeof criar>) => f.componentInstance as any;

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Router.prototype, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('calcula o IMC ao vivo, mesmo que o ion-input entregue texto', () => {
    const fixture = criar();
    pagina(fixture).form.patchValue({ altura: '1.75', peso: '70' });
    fixture.detectChanges();
    expect(pagina(fixture).imc()).toBe(22.86);
    expect(pagina(fixture).classificacao()).toBe('Peso normal');
  });

  it('usuário novo vê os dados do cadastro preenchidos; massas são opcionais', () => {
    const fixture = criar();
    carregar(fixture, null);

    expect(pagina(fixture).form.value).toMatchObject(CONTA);
    expect(pagina(fixture).form.valid).toBe(false);

    pagina(fixture).form.patchValue({ altura: 1.75, peso: 70, metaPeso: 68 });
    expect(pagina(fixture).form.valid).toBe(true);
    expect(fixture.nativeElement.querySelector('app-troca-senha')).toBeNull();
  });

  it('usuário novo cria as medidas com POST (números, null nas massas, sem nome) e vai à visão geral', () => {
    const fixture = criar();
    carregar(fixture, null);
    pagina(fixture).form.patchValue({ altura: '1.75', peso: '70', metaPeso: '68', massaMagra: '' });

    pagina(fixture).salvar();

    const req = http.expectOne({ method: 'POST', url: `${API_URL}/perfil` });
    expect(req.request.body).toEqual({
      altura: 1.75, peso: 70, metaPeso: 68, massaMagra: null, massaGorda: null
    });
    http.expectNone({ method: 'PUT', url: `${API_URL}/conta` });
    req.flush(MEDIDAS);
    expect(Router.prototype.navigateByUrl).toHaveBeenCalledWith('/visao-geral', { replaceUrl: true });
  });

  it('usuário com cadastro vê conta e medidas, salva com PUT e mostra a troca de senha', () => {
    const fixture = criar();
    carregar(fixture, MEDIDAS);
    expect(pagina(fixture).form.value.nome).toBe('Ana Souza');
    expect(pagina(fixture).form.value.peso).toBe(80);
    expect(fixture.nativeElement.querySelector('app-troca-senha')).not.toBeNull();

    pagina(fixture).salvar();
    http.expectNone({ method: 'PUT', url: `${API_URL}/conta` });
    http.expectOne({ method: 'PUT', url: `${API_URL}/perfil` }).flush(MEDIDAS);
  });

  it('alterar o cadastro salva a conta primeiro e atualiza o "Olá" do menu', () => {
    const fixture = criar();
    carregar(fixture, MEDIDAS);
    pagina(fixture).form.patchValue({ nomeUsuario: 'ana2' });

    pagina(fixture).salvar();

    const conta = http.expectOne({ method: 'PUT', url: `${API_URL}/conta` });
    expect(conta.request.body).toEqual({ nome: 'Ana Souza', nomeUsuario: 'ana2', email: 'ana@teste.com' });
    http.expectNone({ method: 'PUT', url: `${API_URL}/perfil` });
    conta.flush({ ...CONTA, nomeUsuario: 'ana2' });

    expect(TestBed.inject(AuthService).nomeUsuario()).toBe('ana2');
    http.expectOne({ method: 'PUT', url: `${API_URL}/perfil` }).flush(MEDIDAS);
  });

  it('mostra o erro e não salva as medidas se a conta for recusada', () => {
    const fixture = criar();
    carregar(fixture, MEDIDAS);
    pagina(fixture).form.patchValue({ nomeUsuario: 'em-uso' });

    pagina(fixture).salvar();
    http.expectOne({ method: 'PUT', url: `${API_URL}/conta` })
      .flush({ detail: 'Este nome de usuario ja esta em uso.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    http.expectNone({ method: 'PUT', url: `${API_URL}/perfil` });
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('ja esta em uso');
    expect(TestBed.inject(AuthService).nomeUsuario()).toBe('ana');
  });
});

describe('TrocaSenhaComponent', () => {
  const URL = `${API_URL}/conta/senha`;

  function criar() {
    TestBed.configureTestingModule({
      imports: [TrocaSenhaComponent],
      providers: [provideIonicAngular(), provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(TrocaSenhaComponent);
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController), c: fixture.componentInstance as any };
  }

  it('não envia com campos vazios, senha curta ou confirmação diferente', () => {
    const { c, http } = criar();
    c.trocar();
    c.form.setValue({ senhaAtual: 'atual-123', novaSenha: 'curta', confirmacao: 'curta' });
    c.trocar();
    c.form.setValue({ senhaAtual: 'atual-123', novaSenha: 'nova-senha-1', confirmacao: 'outra-coisa-2' });
    c.trocar();
    http.expectNone(URL);
  });

  it('envia a senha atual e a nova, mostra sucesso e limpa o formulário', () => {
    const { fixture, c, http } = criar();
    c.form.setValue({ senhaAtual: 'atual-123', novaSenha: 'nova-senha-1', confirmacao: 'nova-senha-1' });

    c.trocar();

    const req = http.expectOne({ method: 'PUT', url: URL });
    expect(req.request.body).toEqual({ senhaAtual: 'atual-123', novaSenha: 'nova-senha-1' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role=status]').textContent).toContain('Senha alterada');
    expect(c.form.value.senhaAtual).toBe('');
  });

  it('mostra o motivo quando a senha atual está errada, sem limpar o formulário', () => {
    const { fixture, c, http } = criar();
    c.form.setValue({ senhaAtual: 'errada-123', novaSenha: 'nova-senha-1', confirmacao: 'nova-senha-1' });

    c.trocar();
    http.expectOne(URL).flush({ detail: 'A senha atual esta incorreta.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('senha atual esta incorreta');
    expect(fixture.nativeElement.querySelector('[role=status]')).toBeNull();
    expect(c.form.value.novaSenha).toBe('nova-senha-1');
  });
});
