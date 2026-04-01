import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly storageKey = 'etiketten-admin-authenticated';
  private readonly adminUsername = 'admin';
  private readonly adminPassword = 'kerkpoort';

  isAuthenticated(): boolean {
    return sessionStorage.getItem(this.storageKey) === 'true';
  }

  login(username: string, password: string): boolean {
    const isValid = username === this.adminUsername && password === this.adminPassword;

    if (isValid) {
      sessionStorage.setItem(this.storageKey, 'true');
    }

    return isValid;
  }

  logout(): void {
    sessionStorage.removeItem(this.storageKey);
  }
}
