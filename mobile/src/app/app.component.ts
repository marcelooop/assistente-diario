import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  MenuController
} from '@ionic/angular';

import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [
    RouterLink,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonMenuToggle
  ]
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
  private readonly menu = inject(MenuController);

  /** Nome de usuário; cai para o e-mail se a sessão for anterior ao nome de usuário. */
  protected readonly saudacao = computed(() => this.auth.nomeUsuario() ?? this.auth.email());

  protected async sair(): Promise<void> {
    await this.menu.close();
    this.auth.sair();
  }
}
