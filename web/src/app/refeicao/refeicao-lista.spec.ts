import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RefeicaoLista } from './refeicao-lista';

const API = 'http://localhost:8080/api/refeicoes';

const CAFE = {
  id: 1, nome: 'Café da manhã', horario: '07:30', totalCalorias: 198, compartilhadaPor: null,
  alimentos: [{ id: 1, nome: 'Pão', calorias: 120 }, { id: 2, nome: 'Ovo', calorias: 78 }]
};
const ALMOCO = {
  id: 2, nome: 'Almoço', horario: '12:30', totalCalorias: 450, compartilhadaPor: 'maria',
  alimentos: [{ id: 3, nome: 'Arroz', calorias: 200 }, { id: 4, nome: 'Frango', calorias: 250 }]
};

describe('RefeicaoLista', () => {
  let http: HttpTestingController;

  function criar(lista: object[] = [CAFE, ALMOCO]) {
    TestBed.configureTestingModule({
      imports: [RefeicaoLista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RefeicaoLista);
    fixture.detectChanges();
    http.expectOne({ method: 'GET', url: API }).flush(lista);
    fixture.detectChanges();
    return fixture;
  }

  const c = (f: ReturnType<typeof criar>) => f.componentInstance as any;
  const texto = (f: ReturnType<typeof criar>) => (f.nativeElement as HTMLElement).textContent ?? '';
  const botao = (f: ReturnType<typeof criar>, rotulo: string, indice = 0) =>
    (Array.from((f.nativeElement as HTMLElement).querySelectorAll('button, a.botao')) as HTMLElement[])
      .filter((b) => b.textContent?.trim() === rotulo)[indice];

  it('mostra as refeições com horário, total, alimentos e de quem foi recebida', () => {
    const fixture = criar();
    const cartoes = fixture.nativeElement.querySelectorAll('article.refeicao');
    expect(cartoes.length).toBe(2);
    expect(texto(fixture)).toContain('Café da manhã');
    expect(texto(fixture)).toContain('07:30');
    expect(texto(fixture)).toContain('198 kcal');
    expect(texto(fixture)).toContain('Pão');
    expect(texto(fixture)).toContain('Recebida de @maria');
    expect(cartoes[0].textContent).not.toContain('Recebida de');
  });

  it('tem o botão de cadastrar nova refeição apontando para a página de cadastro', () => {
    const fixture = criar();
    expect(botao(fixture, 'Cadastrar nova refeição').getAttribute('href')).toBe('/refeicoes/nova');
  });

  it('cada refeição tem o link de edição', () => {
    const fixture = criar();
    expect(botao(fixture, 'Editar', 1).getAttribute('href')).toBe('/refeicoes/2/editar');
  });

  it('sem refeições mostra o convite para cadastrar', () => {
    const fixture = criar([]);
    expect(texto(fixture)).toContain('ainda não cadastrou nenhuma refeição');
    expect(botao(fixture, 'Cadastrar a primeira refeição').getAttribute('href')).toBe('/refeicoes/nova');
  });

  it('mostra o erro de conexão ao carregar', () => {
    TestBed.configureTestingModule({
      imports: [RefeicaoLista],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(RefeicaoLista);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(API).error(new ProgressEvent('error'), { status: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('conectar ao servidor');
  });

  it('exclui após confirmar e recarrega a lista', () => {
    const fixture = criar();
    spyOn(window, 'confirm').and.returnValue(true);

    botao(fixture, 'Excluir').click();
    http.expectOne({ method: 'DELETE', url: `${API}/1` }).flush(null, { status: 204, statusText: 'No Content' });
    http.expectOne({ method: 'GET', url: API }).flush([ALMOCO]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('article.refeicao').length).toBe(1);
    expect(texto(fixture)).toContain('Refeição "Café da manhã" excluída');
  });

  it('não exclui se o usuário cancelar', () => {
    const fixture = criar();
    spyOn(window, 'confirm').and.returnValue(false);
    botao(fixture, 'Excluir').click();
    http.expectNone({ method: 'DELETE', url: `${API}/1` });
  });

  it('compartilha enviando o nome de usuário (aceita @) e confirma o envio', () => {
    const fixture = criar();
    botao(fixture, 'Compartilhar').click();
    fixture.detectChanges();
    expect(c(fixture).compartilhandoId()).toBe(1);

    c(fixture).destinatario.setValue('  @joao ');
    c(fixture).enviar(CAFE);

    const req = http.expectOne({ method: 'POST', url: `${API}/1/compartilhar` });
    expect(req.request.body).toEqual({ nomeUsuario: 'joao' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(texto(fixture)).toContain('Refeição "Café da manhã" enviada para @joao');
    expect(c(fixture).compartilhandoId()).toBeNull();
  });

  it('não envia sem destinatário', () => {
    const fixture = criar();
    c(fixture).abrirCompartilhar(CAFE);
    c(fixture).enviar(CAFE);
    http.expectNone({ method: 'POST', url: `${API}/1/compartilhar` });
  });

  it('mostra o motivo quando o destinatário não existe e mantém o painel aberto', () => {
    const fixture = criar();
    c(fixture).abrirCompartilhar(CAFE);
    c(fixture).destinatario.setValue('ninguem');
    c(fixture).enviar(CAFE);
    http.expectOne(`${API}/1/compartilhar`)
      .flush({ detail: 'Nao existe usuario com esse nome de usuario.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Nao existe usuario');
    expect(c(fixture).compartilhandoId()).toBe(1);
  });

  it('baixa o PDF com o nome da refeição', () => {
    const fixture = criar();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:pdf');
    spyOn(URL, 'revokeObjectURL');
    let nomeBaixado = '';
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      nomeBaixado = this.download;
    });

    botao(fixture, 'Baixar PDF').click();
    const req = http.expectOne({ method: 'GET', url: `${API}/1/pdf` });
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['%PDF-'], { type: 'application/pdf' }));

    expect(nomeBaixado).toBe('cafe-da-manha.pdf');
    expect(c(fixture).baixandoId()).toBeNull();
  });

  it('mostra erro se o PDF falhar', () => {
    const fixture = criar();
    c(fixture).baixar(CAFE);
    http.expectOne(`${API}/1/pdf`).flush(new Blob(['erro']), { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Não foi possível gerar o PDF');
  });
});
