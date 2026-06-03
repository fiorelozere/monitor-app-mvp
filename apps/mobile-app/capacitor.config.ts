import type { CapacitorConfig } from '@capacitor/cli';
import os from 'os';

function resolveLiveReloadHost(): string {
  const fromEnv = process.env.CAPACITOR_SERVER_HOST?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (process.env.CAPACITOR_LIVE_RELOAD_EMULATOR === 'true') {
    return '10.0.2.2';
  }
  const interfaces = os.networkInterfaces();
  if (interfaces) {
    for (const entries of Object.values(interfaces)) {
      if (!entries) {
        continue;
      }
      for (const entry of entries) {
        const family = entry.family as string | number;
        const isIpv4 = family === 'IPv4' || family === 4;
        if (isIpv4 && !entry.internal) {
          return entry.address;
        }
      }
    }
  }
  return 'localhost';
}

const liveReload = process.env.CAPACITOR_LIVE_RELOAD === 'true';
const port = process.env.CAPACITOR_SERVER_PORT?.trim() || '8100';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'monitor-mobile-scaffold',
  webDir: 'www',
  ...(liveReload
    ? {
        server: {
          url: `http://${resolveLiveReloadHost()}:${port}`,
          cleartext: true,
        },
      }
    : {}),
};

export default config;
