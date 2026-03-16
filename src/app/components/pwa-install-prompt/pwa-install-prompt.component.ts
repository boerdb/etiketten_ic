import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-install-prompt.component.html',
  styleUrls: ['./pwa-install-prompt.component.scss']
})
export class PwaInstallPromptComponent implements OnInit, OnDestroy {
  visible = signal(false);

  private deferredPrompt: any = null;
  private handler = (e: Event) => {
    e.preventDefault();
    this.deferredPrompt = e;
    if (!localStorage.getItem('pwa-install-dismissed')) {
      this.visible.set(true);
    }
  };

  ngOnInit() {
    window.addEventListener('beforeinstallprompt', this.handler);
  }

  ngOnDestroy() {
    window.removeEventListener('beforeinstallprompt', this.handler);
  }

  install() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then(() => {
      this.deferredPrompt = null;
      this.visible.set(false);
    });
  }

  dismiss() {
    localStorage.setItem('pwa-install-dismissed', '1');
    this.visible.set(false);
  }
}
