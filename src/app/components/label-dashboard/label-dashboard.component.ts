import { Component, inject, signal, OnInit } from '@angular/core'; // OnInit toegevoegd
import { CommonModule } from '@angular/common';
import { LabelService } from '../../services/label';
import { PhomemoM110Service } from 'src/app/services/phomemo-m110';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-label-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './label-dashboard.component.html',
  styleUrls: ['./label-dashboard.component.scss']
})
export class LabelDashboardComponent implements OnInit { // OnInit geïmplementeerd
  // Services
  labelService = inject(LabelService);
  private printerService = inject(PhomemoM110Service);

  // UI State
  isSidebarOpen = signal(false);

  // Data koppeling met de service
  activeLabel = this.labelService.activeLabel;
  filteredLabels = this.labelService.filteredLabels;

  ngOnInit() {
    // Cruciaal: haal de labels op bij het starten van de app
    this.labelService.loadLabels();
  }

  // Type veranderd naar number voor MariaDB compatibiliteit
  onSelect(id: number) {
    this.labelService.selectLabel(id);
    this.isSidebarOpen.set(false);
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.labelService.searchTerm.set(input.value);
  }

  // --- Dynamische datums (Getters) ---
  get currentTime(): string {
    return new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  }

  get currentDate(): string {
    return new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  get thtDate(): string {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date.toLocaleString('nl-NL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  toggleSidebar() {
    this.isSidebarOpen.update(open => !open);
  }

 async boemPrinten() {
  const labelElement = document.getElementById('label-to-print');
  if (labelElement) {
    try {
      // Geen 'as any' nodig, de service accepteert nu de div!
      await this.printerService.printLiggendLabel(labelElement);
    } catch (err) {
      alert('Printen mislukt. Controleer bluetooth verbinding.');
    }
  }
}
}
