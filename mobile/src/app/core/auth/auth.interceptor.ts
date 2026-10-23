import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_URL } from '../api.config';
import { AuthService } from './auth.service';

/** Envia o token só para a nossa API e desloga se o servidor recusar a sessão (401). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) {
    return next(req);
  }
  const auth = inject(AuthService);
  const token = auth.token();
  const requisicao = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requisicao).pipe(
    catchError((e) => {
      const sessaoRecusada =
        e instanceof HttpErrorResponse && e.status === 401 && !req.url.startsWith(`${API_URL}/auth/`);
      if (sessaoRecusada) {
        auth.sair();
      }
      return throwError(() => e);
    })
  );
};
