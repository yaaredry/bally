# Bally

Beach sports matchmaking app for pickup games in Tel Aviv and beyond. Players find, create, and join Beach Volleyball, Footvolley, and Teqball games nearby, chat with teammates, and track their game history.

Mobile-first web app (React). Native iOS/Android planned post-MVP.

---

## Features

- **Find games** — map view + list view with filters (sport, skill level, format)
- **Create games** — sport, format, skill level, curated beach location with city filter, duration, notes
- **Join flow** — request to join, host approves/declines, full roster locks the game
- **Real-time chat** — game-specific chat room (Socket.io), approved players only
- **Gear coordination** — players declare who's bringing ball, lines, speaker, or hose
- **Leave game** — approved players can opt out; system message posted to chat automatically
- **Share** — native share sheet (mobile) or clipboard copy (desktop)
- **Player profiles** — avatar, sport, skill level, home beach, games hosted/played
- **Ratings** — 1–5 star ratings between players after game completion (7-day window)
- **Admin dashboard** — full management of users, games, locations, ratings, and metrics

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Maps | Leaflet + React Leaflet + OpenStreetMap tiles |
| Avatars | DiceBear (12 preset seeds) |
| Backend | Node.js, Express |
| Database | PostgreSQL 16 + PostGIS |
| Real-time | Socket.io |
| Auth | JWT in httpOnly cookies |
| Containerization | Docker Compose |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop
- macOS (Apple Silicon or Intel)

### Install

```bash
git clone https://github.com/yaaredry/bally
cd bally
npm install
```

### Run in development

```bash
make dev-server    # start DB + server in Docker (background)
make dev-client    # start Vite on host (separate terminal)
```

- Client: http://localhost:5173
- API: http://localhost:3001

> **Note:** Vite runs natively on the host (not in Docker) due to Apple Silicon rollup binary incompatibility with Alpine Linux containers.

### Seed the database

```bash
make dev-seed
```

Player login: `alex@bally.app` / `password123` (any seeded user shares this password)
Admin login: `admin@bally.app` / `chino1234!`

### Environment variables

Copy `server/.env.example` to `server/.env`:

```
DATABASE_URL=postgres://bally:bally@localhost:5432/bally
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

---

## Project Structure

```
bally/
  client/                   # React + Vite frontend
    src/
      pages/                # Route-level components
      components/           # Shared UI components
      context/              # Auth context (player + admin)
      api/                  # Axios client
      lib/                  # Skill levels, constants
  server/
    src/
      routes/               # Express route handlers
      middleware/           # Auth, requireAdmin
      config/               # DB pool config
    db/
      schema.sql            # Full DB schema
      seed.js               # Seed script
  docker-compose.dev.yml
  docker-compose.prod.yml
  Makefile
```

---

## Sports & Skill Levels

| Sport | Formats | Skill Levels |
|---|---|---|
| Beach Volleyball | 2v2, 3v3, 4v4, Custom | 1–7 (1 = beginner, 7 = elite) |
| Footvolley | 2v2, 3v3, 4v4, Custom | E, D, C, B, A, League |
| Teqball | 1v1, 2v2, Custom | 1–7 |

Games can also be set to **All welcome** (any skill level).

---

## Admin Dashboard

URL: `/admin/login`

| Page | Description |
|---|---|
| Dashboard | User counts, sport/skill breakdown, popular locations, top players |
| Users | Search, suspend/reactivate, edit profile, reset password |
| Games | Filter and cancel games, manage rosters, clear chat |
| Locations | CRUD for curated beach list (city-grouped) |
| Ratings | View and delete player ratings |
| Matching | Skill level distribution + unplayed same-level player pair suggestions |

---

## Useful Make Targets

```bash
make dev           # start everything (docker + vite)
make dev-server    # DB + server in Docker (background)
make dev-client    # Vite dev server on host
make dev-seed      # seed the database
make dev-logs      # tail all container logs
make dev-db        # psql shell into dev DB
make dev-down      # stop and remove containers
make help          # list all targets
```

### Reset DB after schema changes

```bash
make dev-down
docker volume rm bally_pgdata_dev
make dev-server
make dev-seed
```

---

## API Overview

All endpoints are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/signup | — | Register |
| POST | /auth/login | — | Login (sets cookie) |
| POST | /auth/logout | — | Logout |
| GET | /auth/me | cookie | Current user |
| GET | /players/me | cookie | Player profile |
| PUT | /players/me | cookie | Update profile |
| GET | /players/:id | cookie | Public profile |
| GET | /games | cookie | List/search games |
| POST | /games | cookie | Create game |
| GET | /games/:id | cookie | Game detail |
| DELETE | /games/:id | host | Cancel game |
| POST | /games/:id/join | cookie | Request to join |
| DELETE | /games/:id/leave | approved | Leave game |
| GET | /games/:id/requests | host | Join requests |
| PUT | /games/:id/requests/:rid | host | Approve/decline |
| POST | /games/:id/complete | host | Mark complete |
| POST | /games/:id/rate | approved | Rate a player |
| POST | /games/:id/gear | approved | Add gear item |
| DELETE | /games/:id/gear/:item | approved | Remove gear item |
| GET | /locations | — | Active curated locations |
| GET | /admin/* | admin | Admin endpoints |

---

## Known Issues

- **Apple Silicon + Docker:** macOS rollup binaries are incompatible with Alpine Linux. Vite must run on the host.
- **Schema changes:** `CREATE TABLE IF NOT EXISTS` means CHECK constraint changes require a full DB volume reset.
- **Prod npm install in Docker:** Fails on macOS Docker Desktop with `ECONNRESET`. Dev workaround mounts host `node_modules`. Prod strategy TBD.
