import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { registerIcons } from './utils/icon-registry';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // RouterOutlet is nodig om routes te renderen
  template: '<router-outlet></router-outlet>', // De router bepaalt wat hier komt
  styles: [`
    :host {
      display: block;
      height: 100vh;
      margin: 0;
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
