# Bally — Claude Code Project Guide

## What is Bally

Sports matchmaking web app for **Beach Volleyball** and **Footvolley** players in Tel Aviv. Players find and join pickup games nearby, chat with teammates, and manage their game history. MVP is mobile-first web (React); native iOS/Android planned later.

GitHub: https://github.com/yaaredry/bally (private)

---

## Repo Structure

```
bally/                          # npm workspace root
  client/                       # React + Vite frontend
  server/                       # Node.js + Express backend
  docker-compose.dev.yml
  docker-compose.prod.yml
  Makefile
  package.json                  # workspace root — all deps hoisted to root node_modules
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Maps | Leaflet + React Leaflet + OpenStreetMap tiles |
| Backend | Node.js, Express |
| Database | PostgreSQL 16 + PostGIS (geospatial queries) |
| Real-time | Socket.io (game chat) |
| Auth | JWT in httpOnly cookies (`sameSite: lax` dev, `strict` prod) |
| Avatars | DiceBear `/7.x/adventurer/svg?seed=...` — 12 preset seeds, no photo upload in MVP |
| Containerization | Docker Compose (dev + prod variants) |
| Reverse proxy (prod) | Nginx |

---

## Dev Workflow

### Start everything
```bash
make dev-server    # start db + server in Docker (background)
make dev-client    # start Vite on host (in a separate terminal)
# or both at once:
make dev           # docker up + npm run dev:client (foreground)
```

Client runs at **http://localhost:5173**. Server API at **http://localhost:3001**.

> **Important:** The Vite client runs **natively on the host** (not in Docker) because macOS node_modules contain Darwin-specific rollup binaries incompatible with Alpine Linux. Do not put the client in docker-compose.dev.yml.

### Seed the database
```bash
make dev-seed
# Login: alex@bally.app / password123 (any seeded user, all share this password)
```

### Reset DB from scratch (e.g. after schema changes)
```bash
make dev-down
docker volume rm bally_pgdata_dev
make dev-server
make dev-seed
```

### Other useful targets
```bash
make dev-logs          # tail server + db logs
make dev-logs-server   # server logs only
make dev-db            # psql shell into dev DB
make dev-down          # stop + remove containers
make help              # list all targets
```

### Never run `npm start` in the foreground — assume server is already running in Docker.

---

## npm Workspaces

All dependencies are hoisted to root `node_modules`. Running `npm install` from any subdirectory installs to root. Docker dev images mount `./node_modules:/app/node_modules` to avoid re-installing inside containers (Docker TLS/network issues with npm registry on macOS Docker Desktop).

---

## Environment Variables

Copy `.env.example` → `.env` in `server/` for dev. Required vars:

```
DATABASE_URL=postgres://bally:bally@localhost:5432/bally
JWT_SECRET=...
CLIENT_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

Prod uses `.env.prod` (see `.env.prod.example`).

---

## Database Schema

File: `server/db/schema.sql`

```
users           id, email, password_hash, display_name, home_beach,
                sports (TEXT[]), skill_level, avatar_seed,
                games_hosted, games_played, created_at

games           id, host_id, sport, format, skill_level, game_date,
                duration_hours, location_name, location (GEOMETRY Point 4326),
                max_players, notes, status, created_at

game_requests   id, game_id, player_id, status (pending|approved|declined), created_at

chat_messages   id, game_id, sender_id, message, created_at
```

PostGIS used for geospatial game search (`ST_DWithin`, `ST_MakePoint`, `ST_SetSRID`).

---

## Skill Levels (sport-specific)

**Beach Volleyball:** `1, 2, 3, 4, 5, 6, 7` (1 = lowest, 7 = highest)
**Footvolley:** `E, D, C, B, A, League` (E = lowest, League = highest)
**Game-level option:** `All welcome`

DB CHECK constraint enforces: `('1','2','3','4','5','6','7','A','B','C','D','E','League')`

Shared frontend lib: `client/src/lib/skillLevels.js`
- `SKILL_LEVELS_BY_SPORT` — arrays per sport
- `SKILL_BADGE_COLORS` — Tailwind classes per level (for badges)
- `SKILL_HEX` — hex colors per level (for map pins)
- `getSkillLevelsForSports(sports[])` — deduped flat array for multi-sport selections

When sport changes anywhere in the UI (signup, profile, create game, map filter), `skill_level` must be cleared.

---

## API Routes

Base path: `/api`

| Method | Path | Description |
|---|---|---|
| POST | /auth/signup | Register new user |
| POST | /auth/login | Login, sets httpOnly cookie |
| POST | /auth/logout | Clears cookie |
| GET | /auth/me | Current user from cookie |
| GET | /players/me | Current player profile |
| PUT | /players/me | Update profile |
| GET | /players/:id | Public player profile |
| GET | /games | List games (supports lat/lng/radius_km/sport/skill_level/format filters) |
| GET | /games/my/games | Games for current user (must be before /:id route) |
| GET | /games/:id | Game detail |
| POST | /games | Create game |
| DELETE | /games/:id | Cancel game (host only) |
| POST | /games/:id/join | Request to join |
| GET | /games/:id/requests | List join requests (host only) |
| PUT | /games/:id/requests/:requestId | Approve/decline request (host only) |
| POST | /games/:id/complete | Mark game complete (host only) |

---

## Socket.io (Chat)

Auth via cookie-based JWT. Events:
- `join_game_room` — client joins room; server checks host or approved player
- `send_message` — sends chat message
- `new_message` — broadcast to room

---

## Frontend Pages & Components

```
pages/
  Login.jsx         Email/password login
  Signup.jsx        3-step: account → sport/skill/beach → avatar
  MapHome.jsx       Map + list toggle, filter bar (sport/skill/format)
  GameDetail.jsx    Game info, map thumbnail, roster, join button, chat
  CreateGame.jsx    Create game form
  MyGames.jsx       Upcoming/past tabs, hosting vs joined
  HostDashboard.jsx Manage join requests, roster, cancel/complete game
  Profile.jsx       View/edit profile, stats

components/
  Layout.jsx        Header + scrollable content + BottomNav (map = full height)
  BottomNav.jsx     Map / MyGames / Create(FAB) / Profile tabs
  GameCard.jsx      Card used in list view
  SkillBadge.jsx    Colored badge per skill level
  AvatarDisplay.jsx DiceBear img with initials fallback
  AvatarPicker.jsx  12-avatar grid selector
  ProtectedRoute.jsx Redirects to /login if unauthenticated
```

---

## Tailwind Theme

Custom colors in `tailwind.config.js`:
- `brand` — sky blues (primary UI color)
- `accent` — orange (CTA / highlight)

---

## Admin Dashboard

URL: `http://localhost:5173/admin/login` (separate from player login)

**Credentials:** `admin@bally.app` / `chino1234!`

### Routes
| Path | Page |
|---|---|
| /admin/login | Admin login (separate, dark theme) |
| /admin/dashboard | Metrics overview |
| /admin/users | User list with search/filter/suspend |
| /admin/users/:id | User detail: edit profile, reset password, suspend, ratings, game history |
| /admin/games | Game list with filters |
| /admin/games/:id | Game detail: roster management, clear chat, cancel |
| /admin/locations | Location CRUD (curated beach list) |
| /admin/ratings | All ratings, delete individual |
| /admin/matching | Level distribution + unplayed same-level pair suggestions |

### Backend
- `server/src/middleware/requireAdmin.js` — checks `is_admin` on JWT
- `server/src/routes/admin.js` — all admin endpoints under `/api/admin/*`

### Auth flow
- Admin uses the same `/api/auth/login` endpoint; server includes `is_admin` in the JWT
- `AdminAuthContext` verifies `is_admin` flag after login; rejects non-admin accounts
- Admin session is cookie-based (same httpOnly cookie as player app)

---

## Ratings

- Players rate each other after a game is marked **completed**
- Rating window: **7 days** from game date; no ratings accepted after that
- Scale: **1–5 stars**
- One rating per rater/rated pair per game
- Endpoints: `POST /api/games/:id/rate`, `GET /api/games/:id/my-ratings`
- Average rating shown on player profiles and in admin user detail

---

## Locations (curated)

- Admin-managed list stored in `locations` table
- Active locations served at `GET /api/locations` (public, no auth)
- Create Game uses a dropdown populated from this list + "Other / Custom" option
- Custom locations still allow a free-text name + map pin drop

---

## Deployment Target (future)

- GCP VM + Cloudflare DNS
- Prod Docker Compose: db + server + nginx
- Nginx serves static client build, proxies `/api` and `/socket.io` to server container
- Prod npm install inside Docker still needs a solution (macOS Docker Desktop has TLS/network issues with npm registry during image build)

---

## Schema (updated)

New columns on `users`: `is_active BOOLEAN DEFAULT TRUE`, `is_admin BOOLEAN DEFAULT FALSE`

New tables:
```
locations   id, name, lat, lng, is_active, created_at
ratings     id, game_id, rater_id, rated_id, stars (1-5), created_at
            UNIQUE(game_id, rater_id, rated_id)
```

---

## Known Issues / Constraints

- **Apple Silicon + Docker:** macOS rollup binaries (`@rollup/rollup-darwin-arm64`) are incompatible with Alpine Linux containers. Vite must run on host, not in Docker.
- **npm install in Docker prod build:** `npm install` inside Docker build on macOS Docker Desktop fails after ~10 min with `ECONNRESET`. Workaround for dev is mounting host `node_modules`. Prod build strategy TBD.
- **DB volume reset required on schema changes:** `make dev-down && docker volume rm bally_pgdata_dev && make dev-server` — schema uses `CREATE TABLE IF NOT EXISTS` so changes to CHECK constraints won't apply without a fresh volume.
