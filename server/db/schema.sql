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
  skill_level   VARCHAR(20) CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
  avatar_seed   VARCHAR(100) DEFAULT 'beach-ace',
  games_hosted  INT DEFAULT 0,
  games_played  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport         VARCHAR(50) NOT NULL CHECK (sport IN ('Beach Volleyball', 'Footvolley')),
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

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_game ON chat_messages(game_id, created_at);
