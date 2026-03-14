import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
  // De AppComponent is nu alleen een 'shell' voor de router.
  // De logica zit in de componenten die door de router worden geladen.
}
