import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabelService, LabelTemplate } from '../../services/label';
import { RouterLink } from '@angular/router';
import { IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [IonIcon, CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  labelService = inject(LabelService);

  // Standaardwaarden voor een leeg formulier
  private readonly defaultForm: Partial<LabelTemplate> = {
    title: '',
    category: '',
    total_dose: '',
    unit: 'mg',
    total_ml: '',
    concentration_label: ''
  };

  // Formulier data
  formData: Partial<LabelTemplate> = { ...this.defaultForm };

  // Hulpmiddel voor handmatige categorie-invoer
  customCategory = '';

  // UI Status
  isEditing = signal(false);
  openMenuId = signal<number | undefined>(undefined);

  // Sluit het actie-menu als je ergens anders klikt
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.openMenuId() !== undefined && !target.closest('.action-cell')) {
      this.openMenuId.set(undefined);
    }
  }

  ngOnInit() {
    this.labelService.loadLabels();
  }

  /**
   * Automatische berekening van de concentratie (bv. 10 mg / ml)
   */
  updateConcentration() {
    const dosis = parseFloat(this.formData.total_dose?.toString() || '0');
    const ml = parseFloat(this.formData.total_ml?.toString() || '0');
    const unit = this.formData.unit || 'mg';

    if (dosis > 0 && ml > 0) {
      const conc = dosis / ml;
      // Formatteer naar max 2 decimalen, vervang punt door komma (NL stijl)
      const formattedConc = conc.toFixed(2).replace('.', ',').replace(',00', '');
      this.formData.concentration_label = `(${formattedConc} ${unit} / ml)`;
    } else {
      this.formData.concentration_label = '';
    }
  }

  /**
   * Wordt aangeroepen bij handmatige categorie-invoer
   */
  onCustomCategoryChange() {
    // Wordt gebruikt voor binding in de HTML
  }

  toggleActionMenu(id: number | undefined) {
    this.openMenuId.update(current => current === id ? undefined : id);
  }

  editLabel(label: LabelTemplate) {
    this.isEditing.set(true);
    this.formData = { ...label };
    this.customCategory = '';
    this.openMenuId.set(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteLabel(id: number | undefined) {
    if (!id) return;
    this.openMenuId.set(undefined);

    if (confirm('Weet je zeker dat je dit etiket wilt verwijderen uit de database?')) {
      this.labelService.deleteLabel(id).subscribe({
        next: () => {
          this.labelService.loadLabels();
          alert('Etiket verwijderd.');
        },
        error: (err) => {
          console.error('Fout bij verwijderen:', err);
          alert('Kon etiket niet verwijderen.');
        }
      });
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.resetForm();
  }

  resetForm() {
    this.formData = { ...this.defaultForm };
    this.customCategory = '';
  }

  save() {
    const data = { ...this.formData };

    // Als 'Anders' is gekozen in de select, gebruik dan de customCategory
    if (data.category === 'Anders' && this.customCategory) {
      data.category = this.customCategory;
    }

    if (!data.title || !data.category) {
      alert('Naam en Categorie zijn verplicht!');
      return;
    }

    this.labelService.saveLabel(data).subscribe({
      next: () => {
        this.labelService.loadLabels();
        this.resetForm();
        this.isEditing.set(false);
        alert('Opgeslagen in MariaDB!');
      },
      error: (err) => {
        console.error('Fout bij opslaan:', err);
        alert('Er ging iets mis bij het opslaan.');
      }
    });
  }
}
