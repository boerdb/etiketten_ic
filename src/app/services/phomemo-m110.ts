/// <reference types="web-bluetooth" />
import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PhomemoM110Service {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // UUID's voor de Phomemo M110
  private readonly SERVICE_UUID = 0xff00;
  private readonly CHARACTERISTIC_UUID = 0xff02;

  /**
   * Verbindt met de printer
   */
  async connect(): Promise<boolean> {
    try {
      if (this.characteristic && this.device?.gatt?.connected) {
        return true;
      }

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'M110' }, { namePrefix: 'Phomemo' }],
        optionalServices: [this.SERVICE_UUID]
      });

      const server = await this.device.gatt?.connect();
      const service = await server?.getPrimaryService(this.SERVICE_UUID);
      this.characteristic = await service?.getCharacteristic(this.CHARACTERISTIC_UUID) ?? null;

      console.log('Verbonden met Phomemo M110');
      return true;
    } catch (error) {
      console.error('Bluetooth verbinding mislukt:', error);
      return false;
    }
  }

  /**
   * DE BELANGRIJKSTE METHODE:
   * Zet een HTML Element om naar een printbaar formaat
   */
  async printLiggendLabel(element: HTMLElement) {
    // 1. Zorg voor verbinding
    const isConnected = await this.connect();
    if (!isConnected) throw new Error('Geen verbinding met printer');

    // 2. Zet HTML om naar een Canvas (Snapshot maken)
    const canvas = await html2canvas(element, {
      scale: 2, // Hogere resolutie voor scherpe tekst
      logging: false,
      backgroundColor: '#ffffff'
    });

    // 3. Maak het definitieve print-canvas (384px breedte voor M110)
    const printCanvas = document.createElement('canvas');
    printCanvas.width = 384;
    printCanvas.height = 240; // Hoogte voor een 40mm label bij 200dpi
    const ctx = printCanvas.getContext('2d')!;

    // Wit vlak trekken
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);

    // Teken het etiket (indien nodig kun je hier ctx.rotate gebruiken)
    // We schalen de HTML-snapshot naar de 384px breedte van de printer
    ctx.drawImage(canvas, 0, 0, printCanvas.width, printCanvas.height);

    // 4. Pixel data naar Phomemo bytes
    const imageData = ctx.getImageData(0, 0, printCanvas.width, printCanvas.height);
    const printerData = this.convertToPhomemoBytes(imageData);

    // 5. Versturen
    await this.sendToPrinter(printerData);
  }

  private convertToPhomemoBytes(imageData: ImageData): Uint8Array {
    const { data, width, height } = imageData;
    const bytesPerLine = width / 8;
    const buffer = new Uint8Array(bytesPerLine * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Helderheid berekenen (Luminance)
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const isBlack = (r + g + b) / 3 < 128;

        if (isBlack) {
          const byteIdx = (y * bytesPerLine) + Math.floor(x / 8);
          const bitIdx = 7 - (x % 8);
          buffer[byteIdx] |= (1 << bitIdx);
        }
      }
    }

    // Phomemo ESC/POS Header
    const header = new Uint8Array([
      0x1d, 0x76, 0x30, 0x00,
      bytesPerLine % 256, Math.floor(bytesPerLine / 256),
      height % 256, Math.floor(height / 256)
    ]);

    const result = new Uint8Array(header.length + buffer.length);
    result.set(header);
    result.set(buffer, header.length);
    return result;
  }

  private async sendToPrinter(data: Uint8Array) {
    if (!this.characteristic) return;

    const chunkSize = 100; // Iets grotere chunks voor snelheid (indien ondersteund)
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValueWithResponse(chunk);
    }

    // Feed naar snijlijn (2mm extra rollen)
    const feed = new Uint8Array([0x1b, 0x4a, 0x10]);
    await this.characteristic.writeValueWithResponse(feed);
  }
}
