import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../api.config';
import { Refeicao, RefeicaoRequest } from './refeicao.model';

/** Refeições do usuário logado (o servidor identifica o dono pelo token). */
@Injectable({ providedIn: 'root' })
export class RefeicaoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/refeicoes`;

  listar(): Observable<Refeicao[]> {
    return this.http.get<Refeicao[]>(this.url);
  }

  obter(id: number): Observable<Refeicao> {
    return this.http.get<Refeicao>(`${this.url}/${id}`);
  }

  criar(dados: RefeicaoRequest): Observable<Refeicao> {
    return this.http.post<Refeicao>(this.url, dados);
  }

  atualizar(id: number, dados: RefeicaoRequest): Observable<Refeicao> {
    return this.http.put<Refeicao>(`${this.url}/${id}`, dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Envia uma cópia da refeição ao usuário com esse nome de usuário. */
  compartilhar(id: number, nomeUsuario: string): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/compartilhar`, { nomeUsuario });
  }

  baixarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/pdf`, { responseType: 'blob' });
  }
}
