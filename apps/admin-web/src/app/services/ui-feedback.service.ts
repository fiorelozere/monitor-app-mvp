import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiFeedbackService {
  async showError(message: string): Promise<void> {
    this.showToast(message, 'error');
  }

  async showMessage(message: string): Promise<void> {
    this.showToast(message, 'info');
  }

  private showToast(message: string, kind: 'error' | 'info'): void {
    const el = document.createElement('div');
    el.textContent = message;
    el.setAttribute('role', 'status');
    Object.assign(el.style, {
      position: 'fixed',
      left: '50%',
      top: kind === 'error' ? '1rem' : 'auto',
      bottom: kind === 'info' ? '1rem' : 'auto',
      transform: 'translateX(-50%)',
      maxWidth: '90vw',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      color: '#fff',
      background: kind === 'error' ? '#c0392b' : '#2c3e50',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      zIndex: '10000',
      fontSize: '0.9rem',
    });
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), kind === 'error' ? 4000 : 2500);
  }
}
