-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  home_beach    VARCHAR(255),
  sports        TEXT[] DEFAULT '{}',
  skill_level   VARCHAR(20) CHECK (skill_level IN ('1','2','3','4','5','6','7','A','B','C','D','E','League')),
  avatar_seed   VARCHAR(100) DEFAULT 'beach-ace',
  games_hosted  INT DEFAULT 0,
  games_played  INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport         VARCHAR(50) NOT NULL CHECK (sport IN ('Beach Volleyball', 'Footvolley', 'Teqball')),
  format        VARCHAR(20) NOT NULL,
  skill_level   VARCHAR(30) NOT NULL,
  game_date     TIMESTAMPTZ NOT NULL,
  duration_hours DECIMAL(3,1),
  location_name VARCHAR(255) NOT NULL,
  location      GEOMETRY(Point, 4326) NOT NULL,
  max_players   INT NOT NULL,
  notes         TEXT,
  status        VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'full', 'completed', 'cancelled')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_location ON games USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_host ON games(host_id);

-- Game join requests
CREATE TABLE IF NOT EXISTS game_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_requests_game ON game_requests(game_id);
CREATE INDEX IF NOT EXISTS idx_requests_player ON game_requests(player_id);

-- Chat messages (sender_id is NULL for system/operator messages)
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  sender_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  is_system  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_game ON chat_messages(game_id, created_at);

-- Curated locations (admin-managed; users pick from dropdown filtered by city)
CREATE TABLE IF NOT EXISTS locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) UNIQUE NOT NULL,
  city       VARCHAR(100) NOT NULL DEFAULT 'Tel Aviv',
  lat        DECIMAL(9,6) NOT NULL,
  lng        DECIMAL(9,6) NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player ratings (after game completion, 7-day window)
CREATE TABLE IF NOT EXISTS ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rater_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars      SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, rater_id, rated_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_rated ON ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_ratings_game  ON ratings(game_id);

-- Game gear contributions (who is bringing what)
CREATE TABLE IF NOT EXISTS game_gear (
  game_id    UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item       VARCHAR(30) NOT NULL CHECK (item IN ('ball', 'lines', 'speaker', 'hose')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (game_id, player_id, item)
);

CREATE INDEX IF NOT EXISTS idx_gear_game ON game_gear(game_id);
