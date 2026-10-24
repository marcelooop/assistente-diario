import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { mensagemDeErro } from '../api.config';
import { RefeicaoRequest } from './refeicao.model';
import { RefeicaoService } from './refeicao.service';

/** Cadastro (e edição) de uma refeição: nome, horário e quantos alimentos quiser, cada um com calorias. */
@Component({
  selector: 'app-refeicao-form',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './refeicao-form.html',
  styleUrl: './refeicao-form.css'
})
export class RefeicaoForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RefeicaoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** null = nova refeição; número = editando. */
  protected readonly id = signal<number | null>(null);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
    horario: ['', [Validators.required]],
    alimentos: this.fb.array([this.novoAlimento()])
  });

  protected get alimentos() {
    return this.form.controls.alimentos;
  }

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  /** Soma das calorias dos alimentos, ao vivo (o servidor recalcula ao salvar). */
  protected readonly total = computed(() =>
    (this.valores().alimentos ?? []).reduce((soma, a) => soma + (Number(a?.calorias) || 0), 0)
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.id.set(Number(id));
    this.carregando.set(true);
    this.service.obter(Number(id)).subscribe({
      next: (r) => {
        this.form.patchValue({ nome: r.nome, horario: r.horario });
        this.alimentos.clear();
        r.alimentos.forEach((a) => this.alimentos.push(this.novoAlimento(a.nome, a.calorias)));
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erro.set(mensagemDeErro(e, 'Não foi possível carregar a refeição.'));
        this.carregando.set(false);
      }
    });
  }

  protected adicionarAlimento(): void {
    this.alimentos.push(this.novoAlimento());
  }

  /** Sempre fica ao menos um alimento. */
  protected removerAlimento(indice: number): void {
    if (this.alimentos.length > 1) {
      this.alimentos.removeAt(indice);
    }
  }

  protected invalido(campo: AbstractControl | null): boolean {
    return !!campo && campo.invalid && (campo.touched || campo.dirty);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dados: RefeicaoRequest = {
      nome: v.nome!.trim(),
      horario: v.horario!,
      alimentos: v.alimentos.map((a) => ({ nome: a.nome!.trim(), calorias: Number(a.calorias) }))
    };
    const id = this.id();
    const chamada = id === null ? this.service.criar(dados) : this.service.atualizar(id, dados);

    this.salvando.set(true);
    this.erro.set(null);
    chamada.subscribe({
      next: () => this.router.navigateByUrl('/refeicoes'),
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(e, 'Não foi possível salvar a refeição.'));
      }
    });
  }

  private novoAlimento(nome = '', calorias: number | null = null) {
    return this.fb.group({
      nome: [nome, [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
      calorias: [calorias as number | null, [Validators.required, Validators.min(0), Validators.max(100000)]]
    });
  }
}
