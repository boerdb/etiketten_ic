import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  username = '';
  password = '';
  errorMessage = signal('');
  isSubmitting = signal(false);

  constructor() {
    if (this.auth.isAuthenticated()) {
      void this.router.navigate(['/admin']);
    }
  }

  async submit(): Promise<void> {
    this.errorMessage.set('');
    this.isSubmitting.set(true);

    const isValid = this.auth.login(this.username.trim(), this.password);

    if (!isValid) {
      this.errorMessage.set('Onjuiste gebruikersnaam of wachtwoord.');
      this.isSubmitting.set(false);
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/admin';
    await this.router.navigateByUrl(returnUrl);
    this.isSubmitting.set(false);
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/']);
  }
}
