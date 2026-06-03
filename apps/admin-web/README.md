# Admin Monitoring Dashboard

Angular web app for monitoring active Jitsi calls. Runs on port **4200** (backend CORS allows `http://localhost:4200`).

## Prerequisites

- Node.js 20+ (or 22+)
- Backend API at `http://<host>:3000`
- Jitsi at `https://<host>:8443` (accept the self-signed certificate in the browser first)

## Run locally

```bash
cd apps/admin-web
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Environment

Edit `src/environments/environment.ts` to set fixed `apiUrl` or `jitsiDomain`. When left empty, the app uses the current browser hostname with API port `3000` and Jitsi port `8443`.

## Build

```bash
npm run build
```

Output is in `dist/admin-web/`.
