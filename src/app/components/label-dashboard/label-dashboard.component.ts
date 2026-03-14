import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelService } from '../../services/label';
import { PhomemoM110Service } from 'src/app/services/phomemo-m110';

@Component({
  selector: 'app-label-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './label-dashboard.component.html',
  styleUrls: ['./label-dashboard.component.scss']
})
export class LabelDashboardComponent {
  // Services
  labelService = inject(LabelService);
  private printerService = inject(PhomemoM110Service);

  // UI State
  isSidebarOpen = signal(false);

  // Data van de service
  activeLabel = this.labelService.activeLabel;
  filteredLabels = this.labelService.filteredLabels;

  onSelect(id: string) {
    this.labelService.selectLabel(id);
    this.isSidebarOpen.set(false);
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.labelService.searchTerm.set(input.value);
  }

  // Dynamische datums
  get currentTime(): string {
    return new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  }

  get currentDate(): string {
    return new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  get thtDate(): string {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  toggleSidebar() {
    this.isSidebarOpen.update(open => !open);
  }

  async boemPrinten() {
    const labelElement = document.getElementById('label-to-print') as any;
    if (labelElement) {
      try {
        await this.printerService.printLiggendLabel(labelElement);
      } catch (err) {
        alert('Printer niet gevonden of verbinding mislukt');
      }
    }
  }
}
