# Monitor Backend (NestJS)

API for call session management and Jibri recording ingestion.

## Prerequisites

- Node.js 22+
- PostgreSQL 16+ (local or via Docker Compose)

## Local development

1. Copy environment template:

   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL (example with Docker):

   ```bash
   docker run -d --name monitor-postgres -p 5432:5432 \
     -e POSTGRES_USER=monitor -e POSTGRES_PASSWORD=monitor -e POSTGRES_DB=monitor \
     postgres:16-alpine
   ```

3. Create a recordings directory (or use the default `./recordings`):

   ```bash
   mkdir -p recordings
   ```

4. Install and run:

   ```bash
   npm install
   npm run start:dev
   ```

API listens on `http://localhost:3000`. CORS is enabled for Ionic dev servers on ports 8100 and 4200.

## Docker (after DevOps updates Compose)

Build the image from this directory:

```bash
docker build -t monitor-backend .
```

The Compose `backend` service should build or reference this image, run `node dist/main.js`, publish port `3000:3000`, mount the shared `recordings_data` volume at `/recordings`, and keep the existing `DATABASE_*` and `RECORDINGS_DIR` environment variables.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/calls/create` | Create active session; returns `{ id, roomUuid }` |
| GET | `/calls/active` | List sessions with `status: active` |
| PATCH | `/calls/:id/end` | Set `status` to `ended` (404 if missing) |

## Recording file watcher

`RecordingsWatcherService` watches `RECORDINGS_DIR` (default `./recordings` locally, `/recordings` in Docker) with chokidar. New `.mp4` files are processed after `awaitWriteFinish` reports a stable file (3s threshold).

**Matching logic (in order):**

1. **Room in filename:** Among active sessions, if the basename contains exactly one `roomUuid`, assign to that session.
2. **Multiple room matches:** Prefer the single active session without `masterFilePath`; if several, use the most recently created among those still unassigned.
3. **No room in filename:** If exactly one active session has no `masterFilePath`, assign to that session (newest-first list).
4. **Otherwise:** Log a warning and skip (ambiguous or no candidate).

Only active sessions without an existing `masterFilePath` receive an update.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_HOST` | `localhost` | PostgreSQL host |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USER` | `monitor` | PostgreSQL user |
| `DATABASE_PASSWORD` | `monitor` | PostgreSQL password |
| `DATABASE_NAME` | `monitor` | Database name |
| `RECORDINGS_DIR` | `./recordings` | Jibri MP4 output directory |
| `PORT` | `3000` | HTTP port |

TypeORM `synchronize: true` is enabled for MVP development only.
