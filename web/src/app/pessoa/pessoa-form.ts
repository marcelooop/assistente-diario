import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { mensagemDeErro } from '../api.config';
import { calcularImc, classificarImc } from './imc';
import { PessoaRequest } from './pessoa.model';
import { PessoaService } from './pessoa.service';

/** Dados pessoais do usuário logado: primeiro cadastro (usuário novo) ou edição. */
@Component({
  selector: 'app-pessoa-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pessoa-form.html',
  styleUrl: './pessoa-form.css'
})
export class PessoaForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PessoaService);
  private readonly router = inject(Router);

  /** true quando o usuário já tem cadastro (então salvar = atualizar). */
  protected readonly existente = signal(false);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    altura: [null as number | null, [Validators.required, Validators.min(0.5), Validators.max(2.5)]],
    peso: [null as number | null, [Validators.required, Validators.min(1), Validators.max(500)]],
    metaPeso: [null as number | null, [Validators.required, Validators.min(1), Validators.max(500)]],
    massaMagra: [null as number | null, [Validators.min(0), Validators.max(500)]],
    massaGorda: [null as number | null, [Validators.min(0), Validators.max(500)]]
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  /** IMC calculado ao vivo (o servidor recalcula ao salvar). */
  protected readonly imc = computed(() => {
    const { peso, altura } = this.valores();
    return peso && altura && altura > 0 ? calcularImc(peso, altura) : null;
  });

  protected readonly classificacao = computed(() => {
    const imc = this.imc();
    return imc === null ? null : classificarImc(imc);
  });

  ngOnInit(): void {
    this.service.obter().subscribe({
      next: (p) => {
        this.form.patchValue(p);
        this.existente.set(true);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        // 404 = usuário novo, ainda sem cadastro: segue com o formulário em branco
        if (e.status !== 404) {
          this.erro.set(mensagemDeErro(e, 'Não foi possível carregar seus dados.'));
        }
        this.carregando.set(false);
      }
    });
  }

  protected invalido(campo: keyof PessoaRequest): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dados: PessoaRequest = {
      nome: v.nome!.trim(),
      altura: v.altura!,
      peso: v.peso!,
      metaPeso: v.metaPeso!,
      massaMagra: v.massaMagra,
      massaGorda: v.massaGorda
    };
    const chamada = this.existente() ? this.service.atualizar(dados) : this.service.criar(dados);

    this.salvando.set(true);
    this.erro.set(null);
    chamada.subscribe({
      next: () => this.router.navigateByUrl('/inicio'),
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(e, 'Erro ao salvar.'));
      }
    });
  }
}
