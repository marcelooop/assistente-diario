import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { PessoaForm } from './pessoa-form';

describe('PessoaForm', () => {
  const URL = 'http://localhost:8080/api/perfil';

  function criar() {
    TestBed.configureTestingModule({
      imports: [PessoaForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(PessoaForm);
    fixture.detectChanges();
    return fixture;
  }

  function usuarioNovo(fixture: ReturnType<typeof criar>) {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne({ method: 'GET', url: URL }).flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    return http;
  }

  function preencher(fixture: ReturnType<typeof criar>, valores: Record<string, unknown>) {
    (fixture.componentInstance as any).form.patchValue(valores);
    fixture.detectChanges();
  }

  it('calcula o IMC automaticamente a partir de peso e altura', () => {
    const fixture = criar();
    preencher(fixture, { altura: 1.75, peso: 70 });
    expect(fixture.nativeElement.querySelector('.imc strong').textContent).toContain('22.86');
    expect(fixture.nativeElement.querySelector('.imc em').textContent).toContain('Peso normal');
  });

  it('não exige massa magra nem massa gorda', () => {
    const fixture = criar();
    preencher(fixture, { nome: 'Marcelo', altura: 1.75, peso: 70, metaPeso: 68 });
    expect((fixture.componentInstance as any).form.valid).toBeTrue();
  });

  it('exige nome, altura, peso e meta', () => {
    const fixture = criar();
    expect((fixture.componentInstance as any).form.valid).toBeFalse();
  });

  it('usuário novo (404) cria o cadastro, com massas vazias como null e sem IMC, e vai à visão geral', () => {
    const fixture = criar();
    const http = usuarioNovo(fixture);
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl');
    preencher(fixture, { nome: ' Marcelo ', altura: 1.75, peso: 70, metaPeso: 68 });
    (fixture.componentInstance as any).salvar();

    const req = http.expectOne({ method: 'POST', url: URL });
    expect(req.request.body).toEqual({
      nome: 'Marcelo', altura: 1.75, peso: 70, metaPeso: 68, massaMagra: null, massaGorda: null
    });
    req.flush({});
    expect(navegar).toHaveBeenCalledWith('/visao-geral');
  });

  it('usuário com cadastro carrega os dados e salva com PUT', () => {
    const fixture = criar();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne({ method: 'GET', url: URL }).flush({
      id: 1, nome: 'Ana', altura: 1.6, peso: 80, metaPeso: 65, imc: 31.25,
      classificacaoImc: 'Obesidade grau I', massaMagra: null, massaGorda: null
    });
    fixture.detectChanges();
    expect((fixture.componentInstance as any).form.value.nome).toBe('Ana');

    (fixture.componentInstance as any).salvar();
    http.expectOne({ method: 'PUT', url: URL }).flush({});
  });
});

