import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface LabelTemplate {
  id: string;
  category: string;
  title: string;
  total_dose: string;      // Nieuw: bv 500
  unit: string;            // Nieuw: bv mg
  total_ml: string;        // Nieuw: bv 50
  concentration_label: string; // Nieuw: bv (10 mg/ml)
  is_editable: boolean;
}

@Injectable({ providedIn: 'root' })
export class LabelService {
  private http = inject(HttpClient);
  private apiUrl = 'https://weer.benswebradio.nl/api/labels_api.php'; // Verander naar jouw IP

  // Signals voor state management
  labels = signal<LabelTemplate[]>([]);
  activeLabel = signal<LabelTemplate | null>(null);
  searchTerm = signal('');

  constructor() {
    this.loadLabels();
  }

  loadLabels() {
    this.http.get<LabelTemplate[]>(this.apiUrl).subscribe({
      next: (data) => this.labels.set(data),
      error: (err) => console.error('Data ophalen mislukt', err)
    });
  }

  selectLabel(id: string) {
    const label = this.labels().find(l => l.id === id);
    if (label) this.activeLabel.set(label);
  }

  // Gefilterde lijst voor de sidebar zoekfunctie
  filteredLabels = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.labels().filter(l =>
      l.title.toLowerCase().includes(term) ||
      l.category.toLowerCase().includes(term)
    );
  });
}
