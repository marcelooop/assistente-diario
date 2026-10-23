import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonText } from '@ionic/angular';

import { mensagemDeErro } from '../core/api.config';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['../auth-form.scss'],
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonInput, IonButton, IonText]
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]]
  });

  protected entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, senha } = this.form.getRawValue();
    this.enviando.set(true);
    this.erro.set(null);
    this.auth.login(email.trim(), senha).subscribe({
      next: (r) => this.router.navigateByUrl(this.auth.destinoPosLogin(r), { replaceUrl: true }),
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(mensagemDeErro(e, 'Não foi possível entrar.'));
      }
    });
  }
}
