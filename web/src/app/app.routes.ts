import { Routes } from '@angular/router';

import { PessoaForm } from './pessoa/pessoa-form';
import { PessoaLista } from './pessoa/pessoa-lista';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pessoas/nova' },
  { path: 'pessoas', component: PessoaLista },
  { path: 'pessoas/nova', component: PessoaForm },
  { path: 'pessoas/:id/editar', component: PessoaForm },
  { path: '**', redirectTo: 'pessoas/nova' }
];
