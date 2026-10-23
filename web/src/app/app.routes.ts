import { Routes } from '@angular/router';

import { authGuard, perfilCompletoGuard, visitanteGuard } from './auth/auth.guards';
import { Login } from './auth/login';
import { Registro } from './auth/registro';
import { Inicio } from './inicio/inicio';
import { PessoaForm } from './pessoa/pessoa-form';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'login', component: Login, canActivate: [visitanteGuard] },
  { path: 'registrar', component: Registro, canActivate: [visitanteGuard] },
  { path: 'perfil', component: PessoaForm, canActivate: [authGuard] },
  { path: 'inicio', component: Inicio, canActivate: [authGuard, perfilCompletoGuard] },
  { path: '**', redirectTo: 'inicio' }
];
