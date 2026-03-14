/// <reference types="web-bluetooth" />
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PhomemoM110Service {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Specifieke UUID's voor de Phomemo M110
  private readonly SERVICE_UUID = 0xff00;
  private readonly CHARACTERISTIC_UUID = 0xff02;

  /**
   * Start de Bluetooth verbinding
   * Moet aangeroepen worden via een user-gesture (klik op knop)
   */
  async connect(): Promise<boolean> {
    try {
      // Als we al een verbinding hebben, niet opnieuw aanvragen
      if (this.characteristic && this.device?.gatt?.connected) {
        return true;
      }

      // 1. Zoek naar M110 apparaten
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'M110' },
          { namePrefix: 'Phomemo' }
        ],
        optionalServices: [this.SERVICE_UUID]
      });

      // 2. Verbind met de GATT server
      const server = await this.device.gatt?.connect();

      // 3. Haal de service en de schrijf-karakteristiek op
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
   * Converteert canvas pixels naar het binaire Phomemo protocol
   */
  private convertToPhomemoBytes(imageData: ImageData): Uint8Array {
    const { data, width, height } = imageData;
    const bytesPerLine = width / 8;
    const buffer = new Uint8Array(bytesPerLine * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Bepaal of de pixel zwart genoeg is
        const isBlack = data[idx] < 128;

        if (isBlack) {
          const byteIdx = (y * bytesPerLine) + Math.floor(x / 8);
          const bitIdx = 7 - (x % 8);
          buffer[byteIdx] |= (1 << bitIdx);
        }
      }
    }

    // Phomemo M110 Raster Bit Image Commando (GS v 0)
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

  /**
   * Verzendt de data in kleine brokjes over BLE
   */
  private async sendToPrinter(data: Uint8Array) {
    if (!this.characteristic) {
      console.error('Niet verbonden met printer!');
      return;
    }

    const chunkSize = 20; // MTU limiet voor BLE
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValue(chunk);
    }

    // Feed commando om het etiket naar de scheurrand te rollen
    const feedCommand = new Uint8Array([0x1b, 0x64, 0x02]);
    await this.characteristic.writeValue(feedCommand);
  }

  /**
   * Pakt een liggend canvas (80x50), draait het 90 graden en print
   */
  async printLiggendLabel(canvas: HTMLCanvasElement) {
    // Zorg eerst voor verbinding
    const isConnected = await this.connect();
    if (!isConnected) return;

    // Maak een verticaal canvas voor de printer (384px breedte is max voor M110)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 384;
    tempCanvas.height = 640; // 80mm lengte
    const ctx = tempCanvas.getContext('2d')!;

    // Teken het liggende label gedraaid op het verticale canvas
    ctx.save();
    ctx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.restore();

    // Haal de pixels op en converteer naar bytes
    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const printerData = this.convertToPhomemoBytes(imageData);

    // Verstuur naar printer
    await this.sendToPrinter(printerData);
  }
}
