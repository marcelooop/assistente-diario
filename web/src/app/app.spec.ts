import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { AuthService } from './auth/auth.service';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  function logar(nomeUsuario: string | null = 'marcelo') {
    const auth = TestBed.inject(AuthService);
    auth.token.set('abc');
    auth.nomeUsuario.set(nomeUsuario);
    auth.email.set('marcelo@teste.com');
  }

  function abrirMenu(fixture: ReturnType<typeof TestBed.createComponent<App>>) {
    (fixture.nativeElement.querySelector('.menu-botao') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('should create the app', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('sem login mostra só a marca, sem menu', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.marca')?.textContent).toContain('Assistente Diário');
    expect(el.querySelector('.menu')).toBeNull();
  });

  it('logado: menu começa fechado e abre com saudação e opções', () => {
    logar();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.menu-painel')).toBeNull();

    abrirMenu(fixture);

    expect(el.querySelector('.menu-botao')?.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('.saudacao')?.textContent?.trim()).toBe('Olá, marcelo');
    const itens = Array.from(el.querySelectorAll('.menu-painel a, .menu-sair')).map((i) => i.textContent?.trim());
    expect(itens).toEqual(['Visão geral', 'Refeições', 'Meus dados', 'Sair']);
  });

  it('usa o e-mail na saudação se não houver nome de usuário', () => {
    logar(null);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    abrirMenu(fixture);
    expect(fixture.nativeElement.querySelector('.saudacao').textContent).toContain('marcelo@teste.com');
  });

  it('fecha com Esc, clique fora e ao escolher uma opção', () => {
    logar();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    abrirMenu(fixture);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el.querySelector('.menu-painel')).toBeNull();

    abrirMenu(fixture);
    (el.querySelector('main') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.menu-painel')).toBeNull();

    abrirMenu(fixture);
    (el.querySelector('.menu-painel a') as HTMLAnchorElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.menu-painel')).toBeNull();
  });

  it('Sair encerra a sessão e fecha o menu', () => {
    logar();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    abrirMenu(fixture);

    (fixture.nativeElement.querySelector('.menu-sair') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).logado()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.menu')).toBeNull();
  });
});
