import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../api.config';
import { Pessoa, PessoaRequest } from './pessoa.model';

/** Medidas do usuário logado (o servidor identifica o dono pelo token). */
@Injectable({ providedIn: 'root' })
export class PessoaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/perfil`;

  obter(): Observable<Pessoa> {
    return this.http.get<Pessoa>(this.url);
  }

  criar(dados: PessoaRequest): Observable<Pessoa> {
    return this.http.post<Pessoa>(this.url, dados);
  }

  atualizar(dados: PessoaRequest): Observable<Pessoa> {
    return this.http.put<Pessoa>(this.url, dados);
  }
}
