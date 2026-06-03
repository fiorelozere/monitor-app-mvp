# Monitor App — Infrastructure

Docker Compose stack for self-hosted Jitsi Meet (with Jibri recording), a NestJS backend placeholder, and PostgreSQL. Based on the [official docker-jitsi-meet](https://github.com/jitsi/docker-jitsi-meet) layout.

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- OpenSSL (for `gen-passwords.sh`)
- On Linux hosts running Jibri: kernel settings per the [Jibri handbook](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker#jibri-setup) (`snd_aloop`, `/dev/shm` size)

## Quick start

1. Copy environment template:

   ```bash
   cd infrastructure
   cp .env.example .env
   ```

2. Set `PUBLIC_URL` and `DOCKER_HOST_ADDRESS` in `.env` to match how clients reach this host (for local dev, defaults `https://localhost:8443` and `127.0.0.1` are fine).

3. Generate strong XMPP passwords:

   ```bash
   chmod +x gen-passwords.sh create-config-dirs.sh
   ./gen-passwords.sh
   ```

4. Create Jitsi config directories (required before first `up`):

   ```bash
   ./create-config-dirs.sh
   ```

5. Start the stack:

   ```bash
   docker compose up -d
   ```

6. Open Jitsi: **https://localhost:8443** (HTTP redirect/UI also on port **8000** — use HTTPS for WebRTC).

## Services

| Service   | Image / role                                      | Ports / notes                                      |
|-----------|---------------------------------------------------|----------------------------------------------------|
| web       | `jitsi/web`                                       | 8000 (HTTP), 8443 (HTTPS)                          |
| prosody   | `jitsi/prosody`                                   | Internal XMPP                                      |
| jicofo    | `jitsi/jicofo`                                    | 127.0.0.1:8888 (REST, optional)                    |
| jvb       | `jitsi/jvb`                                       | UDP 10000, Colibri 8080 on localhost               |
| jibri     | `jitsi/jibri`                                     | Records to `/recordings` (shared volume)           |
| backend   | `node:22-alpine` placeholder until NestJS exists | Mounts same recordings volume at `/recordings`     |
| postgres  | `postgres:16-alpine`                              | Persistent DB for backend (Step 2)                 |

## Auth and guest access (MVP)

Per PRD, meetings are opened via unguessable room UUIDs — no login.

| Variable            | Value | Purpose |
|---------------------|-------|---------|
| `ENABLE_AUTH`       | `0`   | No Jitsi login |
| `ENABLE_GUESTS`     | `1`   | Official Jitsi guest/anonymous access flag |
| `ENABLE_GUEST_MODE` | `1`   | PRD alias; kept in `.env` for documentation |

Jitsi containers read `ENABLE_GUESTS`; there is no separate `ENABLE_GUEST_MODE` in upstream images.

## Recording (Jibri)

| Variable               | Value         | Purpose |
|------------------------|---------------|---------|
| `ENABLE_RECORDING`     | `1`           | Enables recording in web, prosody, jicofo |
| `JIBRI_RECORDING_DIR`  | `/recordings` | Where Jibri writes finished `.mp4` files |

The named volume `recordings_data` is mounted at `/recordings` on both **jibri** and **backend** so the NestJS file-watcher can detect completed recordings.

Jibri generates `jibri.conf` inside the container from templates; host path `${CONFIG}/jibri` stores persistent Jibri state (not a hand-edited `jibri.conf` in this repo).

## Backend placeholder

`backend` runs a no-op sleep loop until `apps/backend` exists. It already mounts:

- `recordings_data` → `/recordings`
- `../apps/backend` → `/app` (empty until the NestJS app is added)

When the NestJS app is ready, replace the service with a `build` context pointing at `../apps/backend` and remove the placeholder `command`.

## PostgreSQL

Defaults in `.env.example`:

- User / DB: `monitor`
- Password: `change-me-postgres` (change before production)

Data is stored in the `postgres_data` named volume.

## Volumes

| Volume            | Used by              | Mount point   |
|-------------------|----------------------|---------------|
| `recordings_data` | jibri, backend       | `/recordings` |
| `postgres_data`   | postgres             | `/var/lib/postgresql/data` |
| `${CONFIG}/…`     | web, prosody, jicofo, jvb, jibri | `/config` (per service) |

## Useful commands

```bash
docker compose ps
docker compose logs -f jibri
docker compose down
docker compose down -v
```

`docker compose down -v` removes named volumes (recordings and database).

## Production notes

- Set `PUBLIC_URL` to your real HTTPS origin.
- Set `DOCKER_HOST_ADDRESS` / `JVB_ADVERTISE_IPS` when behind NAT.
- Use strong passwords from `gen-passwords.sh` and rotate `POSTGRES_PASSWORD`.
- Consider a reverse proxy terminating TLS in front of `web` (ports 8000/8443).
