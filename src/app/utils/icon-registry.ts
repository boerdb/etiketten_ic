import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  pencilOutline,
  trashOutline,
  saveOutline,
  addOutline,
  settingsOutline
} from 'ionicons/icons';

/**
 * Registreert alle iconen die in de applicatie worden gebruikt.
 * Dit voorkomt dat we iconen overal los moeten importeren.
 */
export function registerIcons() {
  addIcons({
    'arrow-back-outline': arrowBackOutline,
    'pencil-outline': pencilOutline,
    'trash-outline': trashOutline,
    'save-outline': saveOutline,
    'add-outline': addOutline,
    'settings-outline': settingsOutline
  });
}
