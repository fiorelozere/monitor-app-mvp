import { Injectable } from '@angular/core';
import { resolveJitsiDomain } from '../config/runtime-host';
import {
  JitsiMeetExternalAPI,
  JitsiMeetOptions,
} from '../types/jitsi-external-api';

export class JitsiScriptLoadError extends Error {
  readonly domain: string;

  constructor(domain: string) {
    super(`Could not load Jitsi external API from https://${domain}/external_api.js`);
    this.name = 'JitsiScriptLoadError';
    this.domain = domain;
  }
}

export class JitsiContainerNotReadyError extends Error {
  constructor() {
    super('Jitsi container element is not available');
    this.name = 'JitsiContainerNotReadyError';
  }
}

export class JitsiEmbedError extends Error {
  constructor() {
    super('Could not create Jitsi meeting instance');
    this.name = 'JitsiEmbedError';
  }
}

export interface JitsiEmbedConfig {
  roomName: string;
  parentNode: HTMLElement;
  configOverwrite: Record<string, unknown>;
  interfaceConfigOverwrite: Record<string, unknown>;
  displayName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class JitsiService {
  private scriptLoaded = false;
  private loadPromise: Promise<void> | null = null;

  static formatJoinError(err: unknown): string {
    if (err instanceof JitsiScriptLoadError) {
      const domain = err.domain;
      const localhostHint =
        domain.startsWith('localhost') || domain.startsWith('127.0.0.1')
          ? ' On localhost, each browser must trust the Jitsi certificate separately.'
          : '';
      return `Could not load Jitsi from https://${domain}. Open https://${domain} in this browser and accept the certificate, then retry.${localhostHint}`;
    }
    if (err instanceof JitsiContainerNotReadyError) {
      return 'Call view is not ready yet. Try joining again.';
    }
    if (err instanceof JitsiEmbedError) {
      const domain = resolveJitsiDomain();
      return `Could not start the meeting. Check Jitsi at https://${domain} is running.`;
    }
    return 'Could not join call. Check Jitsi and try again.';
  }

  loadApi(): Promise<void> {
    if (this.scriptLoaded && window.JitsiMeetExternalAPI) {
      return Promise.resolve();
    }
    if (!this.loadPromise) {
      this.loadPromise = this.createLoadPromise();
    }
    return this.loadPromise;
  }

  embed(config: JitsiEmbedConfig): JitsiMeetExternalAPI {
    const domain = resolveJitsiDomain();
    if (!window.JitsiMeetExternalAPI) {
      throw new JitsiScriptLoadError(domain);
    }
    const options: JitsiMeetOptions = {
      roomName: config.roomName,
      parentNode: config.parentNode,
      width: '100%',
      height: '100%',
      configOverwrite: config.configOverwrite,
      interfaceConfigOverwrite: config.interfaceConfigOverwrite,
    };
    if (config.displayName) {
      options.userInfo = { displayName: config.displayName };
    }
    try {
      return new window.JitsiMeetExternalAPI(domain, options);
    } catch {
      throw new JitsiEmbedError();
    }
  }

  dispose(api: JitsiMeetExternalAPI | null | undefined): void {
    if (!api) {
      return;
    }
    try {
      api.dispose();
    } catch {
      return;
    }
  }

  private createLoadPromise(): Promise<void> {
    const domain = resolveJitsiDomain();
    const src = `https://${domain}/external_api.js`;
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        this.scriptLoaded = true;
        resolve();
        return;
      }
      const fail = () => {
        this.loadPromise = null;
        document.querySelector(`script[src="${src}"]`)?.remove();
        reject(new JitsiScriptLoadError(domain));
      };
      const succeed = () => {
        if (window.JitsiMeetExternalAPI) {
          this.scriptLoaded = true;
          resolve();
        } else {
          fail();
        }
      };
      const existing = document.querySelector(
        `script[src="${src}"]`
      ) as HTMLScriptElement | null;
      if (existing) {
        if (window.JitsiMeetExternalAPI) {
          succeed();
          return;
        }
        existing.addEventListener('load', succeed, { once: true });
        existing.addEventListener('error', fail, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = succeed;
      script.onerror = fail;
      document.head.appendChild(script);
    });
  }
}
