import { Routes } from '@angular/router';

import { authGuard, perfilCompletoGuard, visitanteGuard } from './auth/auth.guards';
import { Login } from './auth/login';
import { Registro } from './auth/registro';
import { PessoaForm } from './pessoa/pessoa-form';
import { VisaoGeral } from './visao-geral/visao-geral';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'visao-geral' },
  { path: 'login', component: Login, canActivate: [visitanteGuard] },
  { path: 'registrar', component: Registro, canActivate: [visitanteGuard] },
  { path: 'perfil', component: PessoaForm, canActivate: [authGuard] },
  { path: 'visao-geral', component: VisaoGeral, canActivate: [authGuard, perfilCompletoGuard] },
  { path: '**', redirectTo: 'visao-geral' }
];
