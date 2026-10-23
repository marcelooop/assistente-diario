import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Pessoa } from './pessoa.model';
import { PessoaService } from './pessoa.service';

@Component({
  selector: 'app-pessoa-lista',
  imports: [RouterLink],
  templateUrl: './pessoa-lista.html',
  styleUrl: './pessoa-lista.css'
})
export class PessoaLista implements OnInit {
  private readonly service = inject(PessoaService);

  protected readonly pessoas = signal<Pessoa[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  protected excluir(p: Pessoa): void {
    if (!confirm(`Excluir o cadastro de ${p.nome}?`)) {
      return;
    }
    this.service.excluir(p.id).subscribe({
      next: () => this.carregar(),
      error: () => this.erro.set('Não foi possível excluir.')
    });
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.service.listar().subscribe({
      next: (lista) => {
        this.pessoas.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível conectar ao servidor. O back end está rodando?');
        this.carregando.set(false);
      }
    });
  }
}
