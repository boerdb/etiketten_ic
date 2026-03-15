import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LabelTemplate {
  id?: number;
  title: string;
  category: string;
  total_dose: string;
  unit: string;
  total_ml: string;
  concentration_label: string;
}

@Injectable({
  providedIn: 'root'
})
export class LabelService {
  private http = inject(HttpClient);
  private apiUrl = 'https://weer.benswebradio.nl/api/labels_api.php';

  // --- STATE ---
  labels = signal<LabelTemplate[]>([]);
  searchTerm = signal<string>('');
  activeLabelId = signal<number | null>(null);

  // --- COMPUTED (Logica voor het dashboard) ---
  filteredLabels = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.labels().filter(l =>
      l.title.toLowerCase().includes(term) ||
      l.category.toLowerCase().includes(term)
    );
  });

  activeLabel = computed(() => {
    return this.labels().find(l => l.id === this.activeLabelId()) || null;
  });

  // --- ACTIONS ---
  loadLabels() {
    this.http.get<LabelTemplate[]>(this.apiUrl).subscribe(data => {
      this.labels.set(data);
      // Selecteer automatisch de eerste als er nog niets geselecteerd is
      // if (!this.activeLabelId() && data.length > 0) {
      //   this.activeLabelId.set(data[0].id || null);
      // }
    });
  }

  selectLabel(id: number) {
    this.activeLabelId.set(id);
  }

  deselectLabel() {
    this.activeLabelId.set(null);
  }

  saveLabel(label: Partial<LabelTemplate>): Observable<any> {
    return this.http.post(this.apiUrl, label);
  }

  deleteLabel(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${id}`).pipe(
      tap(() => {
        this.labels.update(prev => prev.filter(l => l.id !== id));
        if (this.activeLabelId() === id) this.activeLabelId.set(null);
      })
    );
  }
}
