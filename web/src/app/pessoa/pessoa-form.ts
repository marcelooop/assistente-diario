import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, of, switchMap, tap, throwError } from 'rxjs';

import { mensagemDeErro } from '../api.config';
import { AuthService } from '../auth/auth.service';
import { Conta, ContaService } from '../conta/conta.service';
import { TrocaSenha } from '../conta/troca-senha';
import { calcularImc, classificarImc } from './imc';
import { Pessoa, PessoaRequest } from './pessoa.model';
import { PessoaService } from './pessoa.service';

/** "Meus dados": dados do cadastro (conta) e medidas do usuário logado. */
@Component({
  selector: 'app-pessoa-form',
  imports: [ReactiveFormsModule, RouterLink, TrocaSenha],
  templateUrl: './pessoa-form.html',
  styleUrl: './pessoa-form.css'
})
export class PessoaForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pessoas = inject(PessoaService);
  private readonly contas = inject(ContaService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  /** true quando o usuário já tem as medidas cadastradas (então salvar = atualizar). */
  protected readonly existente = signal(false);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = this.fb.group({
    // conta (informados no registro)
    nome: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
    nomeUsuario: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9._-]+$/)]
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    // medidas
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
    forkJoin({
      conta: this.contas.obter(),
      // 404 = usuário novo, ainda sem medidas: segue com os campos de medidas em branco
      pessoa: this.pessoas.obter().pipe(
        catchError((e: HttpErrorResponse) => (e.status === 404 ? of(null) : throwError(() => e)))
      )
    }).subscribe({
      next: ({ conta, pessoa }) => {
        this.form.patchValue(conta);
        if (pessoa) {
          this.form.patchValue(pessoa);
        }
        this.existente.set(pessoa !== null);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erro.set(mensagemDeErro(e, 'Não foi possível carregar seus dados.'));
        this.carregando.set(false);
      }
    });
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const conta: Conta = { nome: v.nome!.trim(), nomeUsuario: v.nomeUsuario!, email: v.email!.trim() };
    const medidas: PessoaRequest = {
      altura: v.altura!,
      peso: v.peso!,
      metaPeso: v.metaPeso!,
      massaMagra: v.massaMagra,
      massaGorda: v.massaGorda
    };

    const contaMudou =
      conta.nome !== this.auth.nome() ||
      conta.nomeUsuario !== this.auth.nomeUsuario() ||
      conta.email.toLowerCase() !== this.auth.email();
    const salvarConta$: Observable<unknown> = contaMudou
      ? this.contas.atualizar(conta).pipe(tap((salva) => this.auth.definirConta(salva)))
      : of(null);
    const salvarMedidas$: Observable<Pessoa> = this.existente()
      ? this.pessoas.atualizar(medidas)
      : this.pessoas.criar(medidas);

    this.salvando.set(true);
    this.erro.set(null);
    salvarConta$.pipe(switchMap(() => salvarMedidas$)).subscribe({
      next: () => this.router.navigateByUrl('/visao-geral'),
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(e, 'Erro ao salvar.'));
      }
    });
  }
}
