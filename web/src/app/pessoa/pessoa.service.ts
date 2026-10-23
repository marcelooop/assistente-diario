import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Pessoa, PessoaRequest } from './pessoa.model';

export const API_URL = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class PessoaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/pessoas`;

  listar(): Observable<Pessoa[]> {
    return this.http.get<Pessoa[]>(this.url);
  }

  buscar(id: number): Observable<Pessoa> {
    return this.http.get<Pessoa>(`${this.url}/${id}`);
  }

  criar(dados: PessoaRequest): Observable<Pessoa> {
    return this.http.post<Pessoa>(this.url, dados);
  }

  atualizar(id: number, dados: PessoaRequest): Observable<Pessoa> {
    return this.http.put<Pessoa>(`${this.url}/${id}`, dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
