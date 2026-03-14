export interface LabelTemplate {
  id: string;
  type: 'medication' | 'infusion' | 'patient';
  title: string;
  content: string;
  dosage?: string;
  showBarcode: boolean;
  lastEditedBy?: string;
}
