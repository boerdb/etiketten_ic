import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PrintOptions, Printer } from '@awesome-cordova-plugins/printer/ngx';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class AndroidPrinterService {
  private printer = inject(Printer);

  async printLabelElement(element: HTMLElement): Promise<void> {
    const imageDataUrl = await this.renderElementToImage(element);

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      await this.printViaAndroidDialog(imageDataUrl);
      return;
    }

    this.printViaBrowserFallback(imageDataUrl);
  }

  private async renderElementToImage(element: HTMLElement): Promise<string> {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true
    });

    return canvas.toDataURL('image/png');
  }

  private async printViaAndroidDialog(imageDataUrl: string): Promise<void> {
    const isAvailable = await this.printer.isAvailable();
    if (!isAvailable) {
      throw new Error('Android printservice is niet beschikbaar');
    }

    const options: PrintOptions = {
      name: `IC-Label-${new Date().toISOString().slice(0, 19)}`,
      monochrome: true
    };

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #fff;
            }
            img {
              width: 100%;
              max-width: 100%;
              height: auto;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${imageDataUrl}" alt="IC Label" />
        </body>
      </html>
    `;

    await this.printer.print(htmlContent, options);
  }

  private printViaBrowserFallback(imageDataUrl: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup geblokkeerd, printvenster kon niet worden geopend');
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #fff;
            }
            img {
              width: 100%;
              height: auto;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${imageDataUrl}" alt="IC Label" />
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
}
