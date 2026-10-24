import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { RefeicaoForm } from './refeicao-form';

const API = 'http://localhost:8080/api/refeicoes';

registerLocaleData(localePt);

describe('RefeicaoForm', () => {
  let http: HttpTestingController;

  function criar(id: string | null = null) {
    TestBed.configureTestingModule({
      imports: [RefeicaoForm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RefeicaoForm);
    fixture.detectChanges();
    return fixture;
  }

  const c = (f: ReturnType<typeof criar>) => f.componentInstance as any;

  function preencher(f: ReturnType<typeof criar>) {
    c(f).form.patchValue({ nome: ' Café da manhã ', horario: '07:30' });
    c(f).alimentos.at(0).patchValue({ nome: ' Pão ', calorias: 120 });
  }

  it('começa com um alimento e permite adicionar vários, mas nunca fica sem nenhum', () => {
    const fixture = criar();
    expect(c(fixture).alimentos.length).toBe(1);

    c(fixture).adicionarAlimento();
    c(fixture).adicionarAlimento();
    expect(c(fixture).alimentos.length).toBe(3);

    c(fixture).removerAlimento(0);
    c(fixture).removerAlimento(0);
    c(fixture).removerAlimento(0);
    expect(c(fixture).alimentos.length).toBe(1);
  });

  it('soma as calorias ao vivo', () => {
    const fixture = criar();
    c(fixture).adicionarAlimento();
    c(fixture).alimentos.at(0).patchValue({ nome: 'Pão', calorias: 120.5 });
    c(fixture).alimentos.at(1).patchValue({ nome: 'Ovo', calorias: 78 });
    fixture.detectChanges();

    expect(c(fixture).total()).toBe(198.5);
    expect(fixture.nativeElement.querySelector('.total strong').textContent).toContain('198,5');
  });

  it('exige nome, horário e, em cada alimento, nome e calorias', () => {
    const fixture = criar();
    expect(c(fixture).form.valid).toBeFalse();

    preencher(fixture);
    expect(c(fixture).form.valid).toBeTrue();

    c(fixture).adicionarAlimento(); // novo alimento em branco
    expect(c(fixture).form.valid).toBeFalse();
  });

  it('não envia formulário inválido', () => {
    const fixture = criar();
    c(fixture).salvar();
    http.expectNone(API);
  });

  it('cria a refeição com todos os alimentos e volta para a lista', () => {
    const fixture = criar();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl');
    preencher(fixture);
    c(fixture).adicionarAlimento();
    c(fixture).alimentos.at(1).patchValue({ nome: 'Ovo', calorias: '78' });

    c(fixture).salvar();

    const req = http.expectOne({ method: 'POST', url: API });
    expect(req.request.body).toEqual({
      nome: 'Café da manhã',
      horario: '07:30',
      alimentos: [{ nome: 'Pão', calorias: 120 }, { nome: 'Ovo', calorias: 78 }]
    });
    req.flush({ id: 1 });
    expect(navegar).toHaveBeenCalledWith('/refeicoes');
  });

  it('edição carrega os alimentos e salva com PUT', () => {
    const fixture = criar('7');
    http.expectOne({ method: 'GET', url: `${API}/7` }).flush({
      id: 7, nome: 'Almoço', horario: '12:30', totalCalorias: 350, compartilhadaPor: null,
      alimentos: [{ id: 1, nome: 'Arroz', calorias: 200 }, { id: 2, nome: 'Frango', calorias: 150 }]
    });
    fixture.detectChanges();

    expect(c(fixture).form.value.nome).toBe('Almoço');
    expect(c(fixture).form.value.horario).toBe('12:30');
    expect(c(fixture).alimentos.length).toBe(2);
    expect(c(fixture).total()).toBe(350);

    c(fixture).salvar();
    http.expectOne({ method: 'PUT', url: `${API}/7` }).flush({ id: 7 });
  });

  it('mostra o erro do servidor ao salvar', () => {
    const fixture = criar();
    preencher(fixture);
    c(fixture).salvar();
    http.expectOne({ method: 'POST', url: API })
      .flush({ detail: 'Dados invalidos' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Dados invalidos');
  });
});
