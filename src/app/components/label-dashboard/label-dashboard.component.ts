import { Component, inject, signal, OnInit, computed } from '@angular/core'; // computed toegevoegd
import { CommonModule } from '@angular/common';
import { LabelService, LabelTemplate } from '../../services/label'; // LabelTemplate geïmporteerd
import { AndroidPrinterService } from 'src/app/services/android-printer';
import { RouterLink } from '@angular/router';
import { BRLMChannelResult } from '@rdlabo/capacitor-brotherprint';
import { environment } from 'src/environments/environment';

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
  private printerService = inject(AndroidPrinterService);

  get printerTargetDescription(): string {
    return this.printerService.getPrinterTargetDescription();
  }

  get isNativeAndroidRuntime(): boolean {
    return this.printerService.isNativeAndroidRuntime();
  }

  get isBrotherPluginLoaded(): boolean {
    return this.printerService.isBrotherPluginLoaded();
  }

  get runtimePrinterStatusMessage(): string {
    return this.printerService.getRuntimeStatusMessage();
  }

  get showBrotherDiagnostics(): boolean {
    return environment.showBrotherDiagnostics;
  }

  discoveredPrinters = signal<BRLMChannelResult[]>([]);
  printerDiscoveryMessage = signal('');
  isSearchingPrinters = signal(false);
  isCheckingConfiguredPrinter = signal(false);

  // UI State
  isSidebarOpen = signal(false);
  categoryState = signal<Map<string, boolean>>(new Map()); // Map voor open/dicht state

  // Data
  activeLabel = this.labelService.activeLabel;
  searchTerm = this.labelService.searchTerm;
  filteredLabels = this.labelService.filteredLabels;

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
      await this.printerService.printLabelElement(labelElement);
    } catch (err) {
      alert(this.printerService.getPrintFailureMessage());
    }
  }
}

  async zoekBluetoothPrinters() {
    this.isSearchingPrinters.set(true);
    this.printerDiscoveryMessage.set('Bluetooth printers zoeken...');

    try {
      const printers = await this.printerService.discoverBluetoothPrinters();
      this.discoveredPrinters.set(printers);
      this.printerDiscoveryMessage.set(
        printers.length > 0
          ? `${printers.length} Brother printer(s) gevonden.`
          : 'Geen Brother Bluetooth printers gevonden.'
      );
    } catch (error) {
      this.discoveredPrinters.set([]);
      this.printerDiscoveryMessage.set(this.toMessage(error, 'Zoeken naar printers is mislukt.'));
    } finally {
      this.isSearchingPrinters.set(false);
    }
  }

  async controleerGeconfigureerdePrinter() {
    this.isCheckingConfiguredPrinter.set(true);
    this.printerDiscoveryMessage.set('Geconfigureerde printer controleren...');

    try {
      const isAvailable = await this.printerService.isConfiguredPrinterAvailable();
      this.printerDiscoveryMessage.set(
        isAvailable
          ? 'De geconfigureerde Brother printer is bereikbaar.'
          : 'De geconfigureerde Brother printer is niet bereikbaar.'
      );
    } catch (error) {
      this.printerDiscoveryMessage.set(this.toMessage(error, 'Controleren van de printer is mislukt.'));
    } finally {
      this.isCheckingConfiguredPrinter.set(false);
    }
  }

  private toMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return fallback;
  }
}
