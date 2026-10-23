import { Component } from '@angular/core';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonTitle, IonToolbar } from '@ionic/angular';

/** Página inicial do app: por enquanto só o título; será evoluída nas próximas etapas. */
@Component({
  selector: 'app-visao-geral',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Visão geral</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding"></ion-content>
  `,
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent]
})
export class VisaoGeralPage {}
