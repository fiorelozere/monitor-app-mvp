import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Jitsi } from 'capacitor-jitsi-meet';
import { participantJitsiNative } from '../config/jitsi-presets';
import { resolveJitsiServerUrl } from '../config/runtime-host';

export class JitsiNativeUnavailableError extends Error {
  constructor() {
    super('Native Jitsi is only available on Android and iOS devices');
    this.name = 'JitsiNativeUnavailableError';
  }
}

export class JitsiJoinError extends Error {
  readonly serverUrl: string;

  constructor(serverUrl: string, cause?: unknown) {
    super(`Could not join conference at ${serverUrl}`);
    this.name = 'JitsiJoinError';
    this.serverUrl = serverUrl;
    if (cause instanceof Error && cause.message) {
      this.message = `${this.message}: ${cause.message}`;
    }
  }
}

export interface JitsiJoinConfig {
  roomName: string;
  onConferenceLeft?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class JitsiService {
  private conferenceActive = false;
  private leftHandler: (() => void) | null = null;
  private readonly conferenceLeftListener = () => {
    this.ngZone.run(() => {
      if (!this.conferenceActive) {
        return;
      }
      this.conferenceActive = false;
      const handler = this.leftHandler;
      this.leftHandler = null;
      handler?.();
    });
  };

  constructor(private readonly ngZone: NgZone) {}

  static formatJoinError(err: unknown): string {
    if (err instanceof JitsiNativeUnavailableError) {
      return 'Video calls require the Android or iOS app. Install the native build on a device or emulator.';
    }
    if (err instanceof JitsiJoinError) {
      return `Could not start the meeting. Check Jitsi at ${err.serverUrl} is running and matches your Docker PUBLIC_URL.`;
    }
    return 'Could not join call. Check Jitsi and try again.';
  }

  isNativeAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }

  async joinConference(config: JitsiJoinConfig): Promise<void> {
    if (!this.isNativeAvailable()) {
      throw new JitsiNativeUnavailableError();
    }
    const url = resolveJitsiServerUrl();
    this.leftHandler = config.onConferenceLeft ?? null;
    this.bindConferenceEvents();
    try {
      const result = await Jitsi.joinConference({
        roomName: config.roomName,
        url,
        featureFlags: participantJitsiNative.featureFlags,
        configOverrides: participantJitsiNative.configOverrides,
        chatEnabled: participantJitsiNative.chatEnabled,
        inviteEnabled: participantJitsiNative.inviteEnabled,
        recordingEnabled: participantJitsiNative.recordingEnabled,
        liveStreamingEnabled: participantJitsiNative.liveStreamingEnabled,
        screenSharingEnabled: participantJitsiNative.screenSharingEnabled,
      });
      if (result.success === false) {
        throw new JitsiJoinError(url);
      }
      this.conferenceActive = true;
    } catch (err) {
      this.unbindConferenceEvents();
      this.leftHandler = null;
      if (err instanceof JitsiNativeUnavailableError || err instanceof JitsiJoinError) {
        throw err;
      }
      throw new JitsiJoinError(url, err);
    }
  }

  async leaveConference(): Promise<void> {
    if (!this.isNativeAvailable()) {
      return;
    }
    try {
      await Jitsi.leaveConference();
    } catch {
      return;
    } finally {
      this.conferenceActive = false;
      this.leftHandler = null;
      this.unbindConferenceEvents();
    }
  }

  private bindConferenceEvents(): void {
    window.addEventListener('onConferenceLeft', this.conferenceLeftListener);
    window.addEventListener(
      'onConferenceTerminated',
      this.conferenceLeftListener
    );
  }

  private unbindConferenceEvents(): void {
    window.removeEventListener('onConferenceLeft', this.conferenceLeftListener);
    window.removeEventListener(
      'onConferenceTerminated',
      this.conferenceLeftListener
    );
  }
}
