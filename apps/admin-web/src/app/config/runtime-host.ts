import { environment } from '../../environments/environment';

export function resolveAppHostname(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }
  return window.location.hostname;
}

export function resolveJitsiDomain(): string {
  if (environment.jitsiDomain) {
    return environment.jitsiDomain;
  }
  return `${resolveAppHostname()}:${environment.jitsiPort}`;
}

export function resolveApiUrl(): string {
  if (environment.apiUrl) {
    return environment.apiUrl.replace(/\/$/, '');
  }
  const hostname = resolveAppHostname();
  const protocol =
    typeof window !== 'undefined' ? window.location.protocol : 'http:';
  return `${protocol}//${hostname}:3000`;
}
