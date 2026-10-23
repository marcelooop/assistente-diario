import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TrocaSenha } from './troca-senha';

const URL = 'http://localhost:8080/api/conta/senha';

describe('TrocaSenha', () => {
  function criar() {
    TestBed.configureTestingModule({
      imports: [TrocaSenha],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(TrocaSenha);
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
