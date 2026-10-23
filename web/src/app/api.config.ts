import { HttpErrorResponse } from '@angular/common/http';

export const API_URL = 'http://localhost:8080/api';

/** Texto amigável para erros de chamadas à API. */
export function mensagemDeErro(e: HttpErrorResponse, padrao = 'Ocorreu um erro. Tente novamente.'): string {
  if (e.status === 0) {
    return 'Não foi possível conectar ao servidor. O back end está rodando?';
  }
  return e.error?.detail ?? padrao;
}
