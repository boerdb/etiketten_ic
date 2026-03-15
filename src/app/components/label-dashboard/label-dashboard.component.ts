import { Component, inject, signal, OnInit, computed } from '@angular/core'; // computed toegevoegd
import { CommonModule } from '@angular/common';
import { LabelService, LabelTemplate } from '../../services/label'; // LabelTemplate geïmporteerd
import { PhomemoM110Service } from 'src/app/services/phomemo-m110';
import { RouterLink } from '@angular/router';

// Interface voor de gegroepeerde data
export interface LabelGroup {
  category: string;
  labels: LabelTemplate[];
}

@Component({
  selector: 'app-label-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './label-dashboard.component.html',
  styleUrls: ['./label-dashboard.component.scss']
})
export class LabelDashboardComponent implements OnInit {
  // Services
  labelService = inject(LabelService);
  private printerService = inject(PhomemoM110Service);

  // UI State
  isSidebarOpen = signal(false);
  categoryState = signal<Map<string, boolean>>(new Map()); // Map voor open/dicht state

  // Data
  activeLabel = this.labelService.activeLabel;
  private filteredLabels = this.labelService.filteredLabels; // DEZE GEBRUIKEN!

  // Computed property om labels te groeperen op basis van de al gefilterde lijst
  groupedLabels = computed(() => {
    const filtered = this.filteredLabels();

    // Groepeer de gefilterde labels
    const groups: { [key: string]: LabelTemplate[] } = filtered.reduce((acc, label) => {
      const { category } = label;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(label);
      return acc;
    }, {} as { [key: string]: LabelTemplate[] });

    // Converteer naar een array en sorteer
    return Object.keys(groups)
      .sort() // Sorteer de categorieën alfabetisch
      .map(category => ({
        category,
        labels: groups[category].sort((a, b) => a.title.localeCompare(b.title)) // Sorteer labels binnen de groep
      }));
  });

  ngOnInit() {
    this.labelService.loadLabels();
  }

  // Categorie open/dicht zetten (accordion style)
  toggleCategory(category: string) {
    this.categoryState.update(currentMap => {
      const wasOpen = !!currentMap.get(category);
      const newMap = new Map<string, boolean>();

      // Als de geklikte categorie nog niet open was, open deze dan.
      // Alle andere categorieën worden automatisch gesloten omdat we een nieuwe map gebruiken.
      if (!wasOpen) {
        newMap.set(category, true);
      }

      // Als de categorie al open was, zal de nieuwe (lege) map ervoor zorgen dat deze sluit.
      return newMap;
    });
  }

  // Type veranderd naar number voor MariaDB compatibiliteit
  onSelect(id: number) {
    this.labelService.selectLabel(id);
    this.isSidebarOpen.set(false);
  }

  goHome() {
    this.labelService.deselectLabel();
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
