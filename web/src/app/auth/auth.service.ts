import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_URL } from '../api.config';

export interface AuthResponse {
  token: string;
  email: string;
  /** Nome da pessoa (ex.: "Marcelo Silva"). */
  nome: string;
  /** Apelido exibido em "Olá, ...". */
  nomeUsuario: string;
  /** false = usuário novo, que ainda precisa preencher os dados pessoais. */
  perfilCompleto: boolean;
}

const CHAVE_TOKEN = 'assistente.token';
const CHAVE_EMAIL = 'assistente.email';
const CHAVE_USUARIO = 'assistente.usuario';
const CHAVE_NOME = 'assistente.nome';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(ler(CHAVE_TOKEN));
  readonly email = signal<string | null>(ler(CHAVE_EMAIL));
  readonly nome = signal<string | null>(ler(CHAVE_NOME));
  readonly nomeUsuario = signal<string | null>(ler(CHAVE_USUARIO));
  readonly logado = computed(() => this.token() !== null);

  login(email: string, senha: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, { email, senha })
      .pipe(tap((r) => this.guardar(r)));
  }

  registrar(nome: string, nomeUsuario: string, email: string, senha: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/registrar`, { nome, nomeUsuario, email, senha })
      .pipe(tap((r) => this.guardar(r)));
  }

  sair(): void {
    this.token.set(null);
    this.email.set(null);
    this.nomeUsuario.set(null);
    this.nome.set(null);
    remover(CHAVE_NOME);
    remover(CHAVE_TOKEN);
    remover(CHAVE_EMAIL);
    remover(CHAVE_USUARIO);
    this.router.navigateByUrl('/login');
  }

  /** Usuário novo vai preencher os dados; quem já tem cadastro vai para o início. */
  destinoPosLogin(r: AuthResponse): string {
    return r.perfilCompleto ? '/visao-geral' : '/perfil';
  }

  private guardar(r: AuthResponse): void {
    this.token.set(r.token);
    this.email.set(r.email);
    this.nomeUsuario.set(r.nomeUsuario);
    this.nome.set(r.nome);
    gravar(CHAVE_NOME, r.nome);
    gravar(CHAVE_TOKEN, r.token);
    gravar(CHAVE_EMAIL, r.email);
    gravar(CHAVE_USUARIO, r.nomeUsuario);
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
