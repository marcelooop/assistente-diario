import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { calcularImc, classificarImc } from './imc';
import { PessoaRequest } from './pessoa.model';
import { PessoaService } from './pessoa.service';

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
  private readonly route = inject(ActivatedRoute);

  protected readonly id = signal<number | null>(null);
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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(Number(id));
      this.service.buscar(Number(id)).subscribe({
        next: (p) => this.form.patchValue(p),
        error: () => this.erro.set('Não foi possível carregar o cadastro.')
      });
    }
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
    const id = this.id();
    const chamada = id === null ? this.service.criar(dados) : this.service.atualizar(id, dados);

    this.salvando.set(true);
    this.erro.set(null);
    chamada.subscribe({
      next: () => this.router.navigate(['/pessoas']),
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(
          e.status === 0
            ? 'Não foi possível conectar ao servidor. O back end está rodando?'
            : e.error?.detail ?? 'Erro ao salvar.'
        );
      }
    });
  }
}
