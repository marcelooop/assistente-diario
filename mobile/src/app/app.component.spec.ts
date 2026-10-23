import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideIonicAngular(), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('should create the app', () => {
    expect(TestBed.createComponent(AppComponent).componentInstance).toBeTruthy();
  });

  it('sem login não há menu lateral', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ion-menu')).toBeNull();
  });

  it('logado: menu mostra "Olá, <nome de usuário>" e as opções', () => {
    const auth = TestBed.inject(AuthService);
    auth.token.set('abc');
    auth.definirConta({ nome: 'Marcelo Silva', nomeUsuario: 'marcelo', email: 'm@teste.com' });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.saudacao')?.textContent?.trim()).toBe('Olá, marcelo');
    const itens = Array.from(el.querySelectorAll('ion-item')).map((i) => i.textContent?.trim());
    expect(itens).toEqual(['Visão geral', 'Meus dados', 'Sair']);
  });

  it('sem nome de usuário a saudação usa o e-mail', () => {
    const auth = TestBed.inject(AuthService);
    auth.token.set('abc');
    auth.email.set('m@teste.com');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.saudacao').textContent).toContain('m@teste.com');
  });
});
