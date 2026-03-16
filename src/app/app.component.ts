import { UpdateNotificationComponent } from './components/update-notification/update-notification.component';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { registerIcons } from './utils/icon-registry';
import { PwaInstallPromptComponent } from './components/pwa-install-prompt/pwa-install-prompt.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PwaInstallPromptComponent, UpdateNotificationComponent],
  template: `
    <router-outlet></router-outlet>
    <app-pwa-install-prompt></app-pwa-install-prompt>
    <app-update-notification></app-update-notification>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      margin: 0;
      position: relative;
      isolation: isolate;
    }

    :host::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('/assets/images/medication.jpg');
      background-size: cover;
      background-position: center;
      filter: blur(10px) brightness(0.5);
      z-index: -1;
    }
  `]
})
export class AppComponent {
  ngOnInit() {
    registerIcons(); // Hier worden alle iconen in het geheugen geladen
  }
  // De AppComponent is nu alleen een 'shell' voor de router.
  // De logica zit in de componenten die door de router worden geladen.
}
