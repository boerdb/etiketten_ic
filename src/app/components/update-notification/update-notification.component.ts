import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-update-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-notification.component.html',
  styleUrls: ['./update-notification.component.scss']
})
export class UpdateNotificationComponent implements OnInit {
  visible = signal(false);

  constructor(private swUpdate: SwUpdate) {}

  ngOnInit() {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.pipe(
      filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY')
    ).subscribe(() => {
      this.visible.set(true);
    });
  }

  reload() {
    document.location.reload();
  }

  dismiss() {
    this.visible.set(false);
  }
}
