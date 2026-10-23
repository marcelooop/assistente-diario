import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { IonButton, IonInput, IonText } from '@ionic/angular';

import { mensagemDeErro } from '../core/api.config';
import { ContaService } from '../core/conta/conta.service';

function confirmacaoIgual(g: AbstractControl): ValidationErrors | null {
  return g.get('novaSenha')?.value === g.get('confirmacao')?.value ? null : { senhasDiferentes: true };
}

/** Alterar a senha: exige a senha atual e uma nova de 8 a 72 caracteres. */
@Component({
  selector: 'app-troca-senha',
  templateUrl: 'troca-senha.component.html',
  imports: [ReactiveFormsModule, IonInput, IonButton, IonText]
})
export class TrocaSenhaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contas = inject(ContaService);

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly sucesso = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      senhaAtual: ['', [Validators.required, Validators.maxLength(72)]],
      // 72 é o limite do BCrypt no servidor
      novaSenha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacao: ['', [Validators.required]]
    },
    { validators: confirmacaoIgual }
  );

  protected trocar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { senhaAtual, novaSenha } = this.form.getRawValue();
    this.enviando.set(true);
    this.erro.set(null);
    this.sucesso.set(false);
    this.contas.trocarSenha(senhaAtual, novaSenha).subscribe({
      next: () => {
        this.enviando.set(false);
        this.sucesso.set(true);
        this.form.reset();
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(mensagemDeErro(e, 'Não foi possível alterar a senha.'));
      }
    });
  }
}
