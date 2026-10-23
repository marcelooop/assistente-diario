import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../api.config';

/** Dados informados no registro (a senha não muda por aqui). */
export interface Conta {
  nome: string;
  nomeUsuario: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ContaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/conta`;

  obter(): Observable<Conta> {
    return this.http.get<Conta>(this.url);
  }

  atualizar(dados: Conta): Observable<Conta> {
    return this.http.put<Conta>(this.url, dados);
  }
}
