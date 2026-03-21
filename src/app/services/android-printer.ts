import { Injectable } from '@angular/core';
import { Capacitor, PluginListenerHandle, PermissionState, registerPlugin } from '@capacitor/core';
import {
  BrotherPrint,
  BrotherPrintEventsEnum,
  BRLMChannelResult,
  BRLMPrintOptions,
  BRLMPrinterLabelName,
  BRLMPrinterModelName,
  BRLMPrinterPort,
  BRLMPrinterScaleMode
} from '@rdlabo/capacitor-brotherprint';
import html2canvas from 'html2canvas';

import { environment } from 'src/environments/environment';

type BluetoothPermissionsStatus = {
  bluetooth: PermissionState;
  location: PermissionState;
};

type BluetoothPermissionsPlugin = {
  checkPermissions(): Promise<BluetoothPermissionsStatus>;
  requestPermissions(): Promise<BluetoothPermissionsStatus>;
};

const BluetoothPermissions = registerPlugin<BluetoothPermissionsPlugin>('BluetoothPermissions');

const LABEL_CONTENT_WIDTH_MM = 85;
const LABEL_CONTENT_HEIGHT_MM = 62;
const LABEL_PAGE_WIDTH_MM = 62;
const LABEL_PAGE_HEIGHT_MM = 85;

@Injectable({
  providedIn: 'root'
})
export class AndroidPrinterService {
  async ensureBluetoothPermissions(): Promise<boolean> {
    if (!this.isNativeAndroidRuntime()) {
      return true;
    }

    const currentStatus = await BluetoothPermissions.checkPermissions();
    if (this.arePermissionsGranted(currentStatus)) {
      return true;
    }

    const requestedStatus = await BluetoothPermissions.requestPermissions();
    return this.arePermissionsGranted(requestedStatus);
  }

  async discoverBluetoothPrinters(searchDuration = 5): Promise<BRLMChannelResult[]> {
    if (!this.isNativeAndroidRuntime()) {
      return [];
    }

    const hasPermissions = await this.ensureBluetoothPermissions();
    if (!hasPermissions) {
      throw new Error('Bluetooth-toestemmingen zijn niet verleend.');
    }

    const printers = new Map<string, BRLMChannelResult>();
    let listenerHandle: PluginListenerHandle | null = null;

    try {
      listenerHandle = await BrotherPrint.addListener(BrotherPrintEventsEnum.onPrinterAvailable, printer => {
        if (!this.isLikelyBrotherBluetoothPrinter(printer)) {
          return;
        }

        const key = `${printer.port}:${printer.channelInfo}`;
        printers.set(key, printer);
      });

      await BrotherPrint.search({
        port: BRLMPrinterPort.bluetooth,
        searchDuration
      });

      await this.delay(searchDuration * 1000);
      return Array.from(printers.values());
    } finally {
      await listenerHandle?.remove();
    }
  }

  async isConfiguredPrinterAvailable(): Promise<boolean> {
    if (!this.isNativeAndroidRuntime()) {
      return false;
    }

    const macAddress = this.getConfiguredMacAddress();
    if (macAddress.length === 0) {
      throw new Error('Brother printer MAC-adres ontbreekt in environment-configuratie.');
    }

    const hasPermissions = await this.ensureBluetoothPermissions();
    if (!hasPermissions) {
      throw new Error('Bluetooth-toestemmingen zijn niet verleend.');
    }

    const result = await BrotherPrint.isChannelAvailable({
      port: BRLMPrinterPort.bluetooth,
      modelName: BRLMPrinterModelName.QL_820NWB,
      serialNumber: '',
      macAddress,
      nodeName: '',
      location: '',
      channelInfo: macAddress
    });

    return result.result;
  }

  isNativeAndroidRuntime(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  isBrotherPluginLoaded(): boolean {
    return Capacitor.isPluginAvailable('BrotherPrint');
  }

  getRuntimeStatusMessage(): string {
    if (this.isNativeAndroidRuntime()) {
      if (!this.isBrotherPluginLoaded()) {
        return 'Brother Capacitor-plugin niet geladen. Controleer Android build/sync en de native SDK-integratie.';
      }

      if (!this.hasConfiguredMacAddress()) {
        return 'Brother plugin geladen, maar het Bluetooth MAC-adres ontbreekt nog in environment.ts / environment.prod.ts.';
      }

      return this.isBrotherPluginLoaded()
        ? 'Brother plugin geladen. Printpad is direct via Brother SDK over Bluetooth.'
        : 'Brother Capacitor-plugin niet geladen. Controleer Android build/sync en de native SDK-integratie.';
    }

    return 'Web/PWA runtime actief. Brother native plugin is alleen beschikbaar in native Android app.';
  }

  async printLabelElement(element: HTMLElement): Promise<void> {
    const imageDataUrl = await this.renderElementToImage(element);
    const rotatedImageDataUrl = await this.rotateImageDataUrl90Clockwise(imageDataUrl);

    if (this.isNativeAndroidRuntime()) {
      const hasPermissions = await this.ensureBluetoothPermissions();
      if (!hasPermissions) {
        throw new Error('Bluetooth-toestemmingen zijn niet verleend.');
      }

      await this.printViaBrotherSdk(rotatedImageDataUrl);
      return;
    }

    await this.printViaBrowserFallback(rotatedImageDataUrl);
  }

  getPrinterTargetDescription(): string {
    if (this.isNativeAndroidRuntime()) {
      const macAddress = this.getConfiguredMacAddress();
      const configuredTarget = macAddress.length > 0 ? `Bluetooth ${macAddress}` : 'Bluetooth MAC nog niet geconfigureerd';
      return `Android app: direct naar Brother QL-820NWB via ${configuredTarget}, DK-22205 (RollW62), label 85 x 62 mm (90 graden gedraaid)`;
    }

    return 'PWA/web: via systeem-printdialoog. Kies daar de Brother QL-820NWB met DK-22205 (62 mm continuous); label wordt 90 graden gedraaid geprint.';
  }

  getPrintFailureMessage(): string {
    if (this.isNativeAndroidRuntime()) {
      return 'Printen mislukt. Controleer Bluetooth-pairing, Android Bluetooth-toestemmingen, het geconfigureerde MAC-adres en of de Brother SDK-library in Android is toegevoegd.';
    }

    return 'Printen mislukt. Controleer in de PWA of de browser de printdialoog mag openen en kies daarin de Brother QL-820NWB als printer.';
  }

  private async renderElementToImage(element: HTMLElement): Promise<string> {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: Math.max(window.devicePixelRatio || 1, 3),
      logging: false,
      useCORS: true
    });

    return canvas.toDataURL('image/png');
  }

  private async rotateImageDataUrl90Clockwise(imageDataUrl: string): Promise<string> {
    const sourceImage = await this.loadImage(imageDataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.height;
    canvas.height = sourceImage.width;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context niet beschikbaar voor rotatie');
    }

    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(Math.PI / 2);
    context.drawImage(sourceImage, -sourceImage.width / 2, -sourceImage.height / 2);

    return canvas.toDataURL('image/png');
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Afbeelding kon niet geladen worden voor printrotatie'));
      image.src = src;
    });
  }

  private async printViaBrotherSdk(imageDataUrl: string): Promise<void> {
    if (!this.isBrotherPluginLoaded()) {
      throw new Error('Brother Capacitor-plugin niet geladen op Android. Controleer Capacitor sync/build en de native SDK-integratie.');
    }

    const macAddress = this.getConfiguredMacAddress();
    if (macAddress.length === 0) {
      throw new Error('Brother printer MAC-adres ontbreekt in environment-configuratie.');
    }

    const printOptions: BRLMPrintOptions = {
      encodedImage: this.stripDataUrlPrefix(imageDataUrl),
      modelName: BRLMPrinterModelName.QL_820NWB,
      labelName: BRLMPrinterLabelName.RollW62,
      port: BRLMPrinterPort.bluetooth,
      channelInfo: macAddress,
      numberOfCopies: 1,
      autoCut: true,
      scaleMode: BRLMPrinterScaleMode.FitPaperAspect
    };

    await BrotherPrint.printImage(printOptions);
  }

  private async printViaBrowserFallback(imageDataUrl: string): Promise<void> {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    const htmlContent = `
      <html>
        <head>
          <title>Print Label</title>
          <style>
            @page {
              size: ${LABEL_PAGE_WIDTH_MM}mm ${LABEL_PAGE_HEIGHT_MM}mm;
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              width: ${LABEL_PAGE_WIDTH_MM}mm;
              height: ${LABEL_PAGE_HEIGHT_MM}mm;
              overflow: hidden;
            }
            .sheet {
              width: ${LABEL_PAGE_WIDTH_MM}mm;
              height: ${LABEL_PAGE_HEIGHT_MM}mm;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            img {
              width: ${LABEL_PAGE_WIDTH_MM}mm;
              height: ${LABEL_PAGE_HEIGHT_MM}mm;
              display: block;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <img src="${imageDataUrl}" alt="IC Label" />
          </div>
        </body>
      </html>
    `;

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        iframe.onload = null;
        iframe.remove();
      };

      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error('Printvenster kon niet worden voorbereid'));
      }, 4000);

      iframe.onload = () => {
        window.clearTimeout(timeoutId);

        const printFrame = iframe.contentWindow;
        if (!printFrame) {
          cleanup();
          reject(new Error('Printframe is niet beschikbaar'));
          return;
        }

        window.setTimeout(() => {
          try {
            printFrame.focus();
            printFrame.print();
            cleanup();
            resolve();
          } catch (error) {
            cleanup();
            reject(this.toError(error));
          }
        }, 150);
      };

      iframe.srcdoc = htmlContent;
      document.body.appendChild(iframe);
    });
  }

  private stripDataUrlPrefix(imageDataUrl: string): string {
    const separatorIndex = imageDataUrl.indexOf(',');
    return separatorIndex >= 0 ? imageDataUrl.slice(separatorIndex + 1) : imageDataUrl;
  }

  private hasConfiguredMacAddress(): boolean {
    return this.getConfiguredMacAddress().length > 0;
  }

  private arePermissionsGranted(status: BluetoothPermissionsStatus): boolean {
    return status.bluetooth === 'granted' && status.location === 'granted';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  private getConfiguredMacAddress(): string {
    return environment.brotherPrinterMacAddress.trim();
  }

  private isLikelyBrotherBluetoothPrinter(printer: BRLMChannelResult): boolean {
    const configuredMac = this.normalizeMacAddress(this.getConfiguredMacAddress());
    const discoveredMac = this.normalizeMacAddress(printer.macAddress || printer.channelInfo);

    if (configuredMac.length > 0 && discoveredMac === configuredMac) {
      return true;
    }

    const searchable = `${printer.modelName} ${printer.nodeName}`.toUpperCase();
    return /BROTHER|\b(QL|TD|RJ|PJ|PT|MW)[-_]/.test(searchable);
  }

  private normalizeMacAddress(value: string): string {
    return value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  }

  private toError(reason: unknown): Error {
    if (reason instanceof Error) {
      return reason;
    }

    if (typeof reason === 'string' && reason.trim().length > 0) {
      return new Error(reason);
    }

    return new Error('Onbekende printerfout');
  }
}
