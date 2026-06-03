# Monitor App Mobile

Ionic Angular participant client for monitored Jitsi video calls on Android and iOS via `capacitor-jitsi-meet` (Capacitor 8).

## Prerequisites

- Node.js 20+ (recommended)
- Backend API on port **3000** (from repo root / Docker)
- Jitsi stack on port **8443** (from `infrastructure/` Docker Compose)
- Android Studio and/or Xcode for native builds

## Configuration

Edit `src/environments/environment.ts` (and `environment.prod.ts` for production builds):

| Field | Default | Purpose |
|-------|---------|---------|
| `apiUrl` | *(empty)* | NestJS backend base URL. Empty = auto: same host as the app, port `3000`. |
| `jitsiDomain` | *(empty)* | Jitsi host only (no scheme), e.g. `192.168.1.10:8443`. Empty = same host as the app, port `jitsiPort`. |
| `jitsiPort` | `8443` | Port used when `jitsiDomain` is empty. |

The native plugin receives `url: https://<jitsiDomain>` (see `resolveJitsiServerUrl()`). For self-hosted Docker Jitsi, set `PUBLIC_URL` in `infrastructure/.env` to the same HTTPS origin clients use (e.g. `https://192.168.1.10:8443`).

## Native Jitsi (Android / iOS)

Video calls use [capacitor-jitsi-meet](https://github.com/calvinckho/capacitor-jitsi-meet) v8, not the web `external_api.js` embed. `ionic serve` in a browser cannot join calls; use a device or emulator.

### Install and sync

```bash
cd apps/mobile-app
npm install
npm run build
npx cap sync
```

### Android

- `minSdkVersion` 26, camera/mic permissions in `AndroidManifest.xml`
- Jitsi Maven repo in `android/build.gradle`
- Java 11 in `android/app/build.gradle`
- Notification icon `android/app/src/main/res/drawable/ic_notification.xml` (required by Jitsi SDK)
- Open: `npx cap open android` or `ionic cap run android`

Trust the Jitsi TLS certificate on the device (open `https://<host>:8443` in the device browser if using self-signed certs).

### iOS

`capacitor-jitsi-meet` requires CocoaPods (not SPM). Add the platform with:

```bash
npx cap add ios --packagemanager CocoaPods
```

(`platform :ios, '15.1'` in `ios/App/Podfile` for JitsiMeetSDK.)

- `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` in `ios/App/App/Info.plist`
- Background modes `audio` and `voip` in Info.plist
- Bitcode disabled for `CapacitorJitsiMeet` in `ios/App/Podfile` `post_install`
- After `npx cap sync`: `cd ios/App && pod install`, then `npx cap open ios`
- Deploy to a physical device or simulator

## Run web UI locally (lists only)

```bash
npm start
```

`npm start` runs `ionic serve --host 0.0.0.0` on port **8100** for the participant list and join URLs. Join/start call actions require the native app.

Open: http://localhost:8100/tabs/participant

## LAN testing

1. Set `PUBLIC_URL` and `DOCKER_HOST_ADDRESS` in `infrastructure/.env` to your LAN IP.
2. On each phone, trust `https://<LAN-IP>:8443` if using self-signed TLS.
3. Build and run the native app with live reload:

```bash
CAPACITOR_LIVE_RELOAD=true CAPACITOR_SERVER_HOST=<LAN-IP> ionic cap run android --livereload
```

The app resolves API and Jitsi hosts from the Capacitor server host / device network when `jitsiDomain` and `apiUrl` are empty.

## Build

```bash
npm run build
npx cap sync
```

Output is written to `www/`.

## Notes

- Participant leave only leaves the native conference; it does not `PATCH /calls/:id/end`.
- Room name is `roomUuid` from the backend; session `id` is used for join URLs and query params only.
