import { Component } from '@angular/core';
import { LabelDashboardComponent } from './components/label-dashboard/label-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LabelDashboardComponent], // Zorg dat deze hier staat!
  template: '<app-label-dashboard></app-label-dashboard>', // We zetten de HTML direct hier, dat is makkelijker
  styles: [`
    :host {
      display: block;
      height: 100vh;
      margin: 0;
    }
  `]
})
export class AppComponent {
  // De AppComponent hoeft zelf geen logica meer te hebben,
  // want alles zit nu in de LabelDashboardComponent
}
