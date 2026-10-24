import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { mensagemDeErro } from '../api.config';
import { baixarArquivo, nomeDeArquivo } from './baixar-arquivo';
import { Refeicao } from './refeicao.model';
import { RefeicaoService } from './refeicao.service';

interface Aviso {
  tipo: 'ok' | 'erro';
  texto: string;
}

/** Lista as refeições com ações: editar, compartilhar com outro usuário, baixar em PDF e excluir. */
@Component({
  selector: 'app-refeicao-lista',
  imports: [RouterLink, ReactiveFormsModule, DecimalPipe],
  templateUrl: './refeicao-lista.html',
  styleUrl: './refeicao-lista.css'
})
export class RefeicaoLista implements OnInit {
  private readonly service = inject(RefeicaoService);

  protected readonly refeicoes = signal<Refeicao[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<Aviso | null>(null);

  /** Refeição cujo painel de compartilhar está aberto (só uma por vez). */
  protected readonly compartilhandoId = signal<number | null>(null);
  protected readonly enviando = signal(false);
  protected readonly baixandoId = signal<number | null>(null);
  protected readonly destinatario = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(30), Validators.pattern(/\S/)]
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected abrirCompartilhar(r: Refeicao): void {
    this.destinatario.reset('');
    this.aviso.set(null);
    this.compartilhandoId.set(r.id);
  }

  protected fecharCompartilhar(): void {
    this.compartilhandoId.set(null);
  }

  protected enviar(r: Refeicao): void {
    if (this.destinatario.invalid) {
      this.destinatario.markAsTouched();
      return;
    }
    // aceita "@maria" e "maria"
    const nomeUsuario = this.destinatario.value.trim().replace(/^@/, '');
    this.enviando.set(true);
    this.service.compartilhar(r.id, nomeUsuario).subscribe({
      next: () => {
        this.enviando.set(false);
        this.compartilhandoId.set(null);
        this.aviso.set({ tipo: 'ok', texto: `Refeição "${r.nome}" enviada para @${nomeUsuario}.` });
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.aviso.set({ tipo: 'erro', texto: mensagemDeErro(e, 'Não foi possível compartilhar.') });
      }
    });
  }

  protected baixar(r: Refeicao): void {
    this.baixandoId.set(r.id);
    this.aviso.set(null);
    this.service.baixarPdf(r.id).subscribe({
      next: (arquivo) => {
        baixarArquivo(arquivo, `${nomeDeArquivo(r.nome)}.pdf`);
        this.baixandoId.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.baixandoId.set(null);
        this.aviso.set({ tipo: 'erro', texto: mensagemDeErro(e, 'Não foi possível gerar o PDF.') });
      }
    });
  }

  protected excluir(r: Refeicao): void {
    if (!confirm(`Excluir a refeição "${r.nome}"?`)) {
      return;
    }
    this.service.excluir(r.id).subscribe({
      next: () => {
        this.aviso.set({ tipo: 'ok', texto: `Refeição "${r.nome}" excluída.` });
        this.carregar();
      },
      error: (e: HttpErrorResponse) =>
        this.aviso.set({ tipo: 'erro', texto: mensagemDeErro(e, 'Não foi possível excluir.') })
    });
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.service.listar().subscribe({
      next: (lista) => {
        this.refeicoes.set(lista);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erro.set(mensagemDeErro(e, 'Não foi possível carregar as refeições.'));
        this.carregando.set(false);
      }
    });
  }
}
