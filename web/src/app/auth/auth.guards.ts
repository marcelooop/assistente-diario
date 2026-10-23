import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { PessoaService } from '../pessoa/pessoa.service';
import { AuthService } from './auth.service';

/** Só entra quem está logado. */
export const authGuard: CanActivateFn = () => {
  return inject(AuthService).logado() ? true : inject(Router).createUrlTree(['/login']);
};

/** Telas de login/registro: quem já está logado vai direto para o início. */
export const visitanteGuard: CanActivateFn = () => {
  return inject(AuthService).logado() ? inject(Router).createUrlTree(['/inicio']) : true;
};

/** O início exige os dados pessoais preenchidos; usuário novo é levado ao cadastro. */
export const perfilCompletoGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(PessoaService)
    .obter()
    .pipe(
      map(() => true),
      catchError((e: HttpErrorResponse) => of(e.status === 404 ? router.createUrlTree(['/perfil']) : true))
    );
};
