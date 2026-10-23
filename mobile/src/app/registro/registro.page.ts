import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonText } from '@ionic/angular';

import { mensagemDeErro } from '../core/api.config';
import { AuthService } from '../core/auth/auth.service';

function senhasIguais(g: AbstractControl): ValidationErrors | null {
  return g.get('senha')?.value === g.get('confirmacao')?.value ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-registro',
  templateUrl: 'registro.page.html',
  styleUrls: ['../auth-form.scss'],
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonInput, IonButton, IonText]
})
export class RegistroPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
      nomeUsuario: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9._-]+$/)]
      ],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      // 72 é o limite do BCrypt no servidor
      senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacao: ['', [Validators.required]]
    },
    { validators: senhasIguais }
  );

  protected criar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nome, nomeUsuario, email, senha } = this.form.getRawValue();
    this.enviando.set(true);
    this.erro.set(null);
    this.auth.registrar(nome.trim(), nomeUsuario, email.trim(), senha).subscribe({
      // conta nova nunca tem medidas: segue direto para o cadastro
      next: (r) => this.router.navigateByUrl(this.auth.destinoPosLogin(r), { replaceUrl: true }),
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(mensagemDeErro(e, 'Não foi possível criar a conta.'));
      }
    });
  }
}
