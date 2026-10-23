import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly menuAberto = signal(false);
  /** Nome de usuário; cai para o e-mail se a sessão for anterior ao nome de usuário. */
  protected readonly saudacao = computed(() => this.auth.nomeUsuario() ?? this.auth.email());

  protected alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }

  protected fecharMenu(): void {
    this.menuAberto.set(false);
  }

  protected sair(): void {
    this.fecharMenu();
    this.auth.sair();
  }

  /** Clique fora do menu fecha. */
  @HostListener('document:click', ['$event'])
  protected aoClicar(evento: Event): void {
    const menu = this.host.nativeElement.querySelector('.menu');
    if (this.menuAberto() && !menu?.contains(evento.target as Node)) {
      this.fecharMenu();
    }
  }

  @HostListener('document:keydown.escape')
  protected aoPressionarEsc(): void {
    this.fecharMenu();
  }
}
