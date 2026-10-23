import { Routes } from '@angular/router';

import { authGuard, perfilCompletoGuard, visitanteGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'visao-geral' },
  {
    path: 'login',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'registrar',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./registro/registro.page').then((m) => m.RegistroPage)
  },
  {
    path: 'meus-dados',
    canActivate: [authGuard],
    loadComponent: () => import('./meus-dados/meus-dados.page').then((m) => m.MeusDadosPage)
  },
  {
    path: 'visao-geral',
    canActivate: [authGuard, perfilCompletoGuard],
    loadComponent: () => import('./visao-geral/visao-geral.page').then((m) => m.VisaoGeralPage)
  },
  { path: '**', redirectTo: 'visao-geral' }
];
