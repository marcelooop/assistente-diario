import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PessoaForm } from './pessoa-form';

describe('PessoaForm', () => {
  function criar() {
    TestBed.configureTestingModule({
      imports: [PessoaForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(PessoaForm);
    fixture.detectChanges();
    return fixture;
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

  it('envia massas vazias como null e não envia IMC', () => {
    const fixture = criar();
    const http = TestBed.inject(HttpTestingController);
    preencher(fixture, { nome: ' Marcelo ', altura: 1.75, peso: 70, metaPeso: 68 });
    (fixture.componentInstance as any).salvar();

    const req = http.expectOne('http://localhost:8080/api/pessoas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nome: 'Marcelo', altura: 1.75, peso: 70, metaPeso: 68, massaMagra: null, massaGorda: null
    });
  });
});
