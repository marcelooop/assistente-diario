import { HttpErrorResponse } from '@angular/common/http';

import { environment } from '../../environments/environment';

export const API_URL = environment.apiUrl;

/** Texto amigável para erros de chamadas à API. */
export function mensagemDeErro(e: HttpErrorResponse, padrao = 'Ocorreu um erro. Tente novamente.'): string {
  if (e.status === 0) {
    return 'Não foi possível conectar ao servidor. O back end está rodando?';
  }
  return e.error?.detail ?? padrao;
}

/** Converte o valor de um campo numérico (o ion-input pode entregar texto) em número ou null. */
export function paraNumero(valor: unknown): number | null {
  return valor === null || valor === undefined || valor === '' ? null : Number(valor);
}
