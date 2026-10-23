import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_URL } from '../api.config';

export interface AuthResponse {
  token: string;
  email: string;
  /** false = usuário novo, que ainda precisa preencher os dados pessoais. */
  perfilCompleto: boolean;
}

const CHAVE_TOKEN = 'assistente.token';
const CHAVE_EMAIL = 'assistente.email';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(ler(CHAVE_TOKEN));
  readonly email = signal<string | null>(ler(CHAVE_EMAIL));
  readonly logado = computed(() => this.token() !== null);

  login(email: string, senha: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, { email, senha })
      .pipe(tap((r) => this.guardar(r)));
  }

  registrar(email: string, senha: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/registrar`, { email, senha })
      .pipe(tap((r) => this.guardar(r)));
  }

  sair(): void {
    this.token.set(null);
    this.email.set(null);
    remover(CHAVE_TOKEN);
    remover(CHAVE_EMAIL);
    this.router.navigateByUrl('/login');
  }

  /** Usuário novo vai preencher os dados; quem já tem cadastro vai para o início. */
  destinoPosLogin(r: AuthResponse): string {
    return r.perfilCompleto ? '/inicio' : '/perfil';
  }

  private guardar(r: AuthResponse): void {
    this.token.set(r.token);
    this.email.set(r.email);
    gravar(CHAVE_TOKEN, r.token);
    gravar(CHAVE_EMAIL, r.email);
  }
}

// localStorage pode lançar exceção (modo privado, dados bloqueados): a sessão então vale só até recarregar.
function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string): void {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* ignorado */
  }
}

function remover(chave: string): void {
  try {
    localStorage.removeItem(chave);
  } catch {
    /* ignorado */
  }
}
