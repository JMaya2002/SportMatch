-- server/src/db/schema.sql
-- Esquema completo de SportMatch. Idempotente (DROP + CREATE).

DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS courts CASCADE;
DROP TABLE IF EXISTS club_venues CASCADE;
DROP TABLE IF EXISTS club_photos CASCADE;
DROP TABLE IF EXISTS club_followers CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS meetup_participants CASCADE;
DROP TABLE IF EXISTS meetups CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(30) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255),
  google_id       VARCHAR(255) UNIQUE,
  name            VARCHAR(100) NOT NULL,
  age             INTEGER NOT NULL CHECK (age >= 18),
  city            VARCHAR(100) NOT NULL,
  main_sport      VARCHAR(50) NOT NULL,
  level           VARCHAR(20) NOT NULL CHECK (level IN ('principiante','intermedio','avanzado')),
  avatar_url      TEXT,
  bio             TEXT,
  age_confirmed   BOOLEAN NOT NULL DEFAULT false,
  is_admin        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_filters ON users (main_sport, level, city);

-- ============================================
-- AMISTADES
-- ============================================
CREATE TABLE friendships (
  requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);
CREATE INDEX idx_friendships_receiver ON friendships (receiver_id, status);

-- ============================================
-- QUEDADAS (RED SOCIAL)
-- ============================================
CREATE TABLE meetups (
  id            SERIAL PRIMARY KEY,
  creator_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  sport         VARCHAR(50) NOT NULL,
  level         VARCHAR(20) NOT NULL CHECK (level IN ('principiante','intermedio','avanzado')),
  city          VARCHAR(100) NOT NULL,
  location      VARCHAR(255),
  meetup_date   TIMESTAMP NOT NULL,
  max_players   INTEGER NOT NULL CHECK (max_players >= 2),
  status        VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','full','cancelled')),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE meetup_participants (
  meetup_id   INTEGER REFERENCES meetups(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (meetup_id, user_id)
);

CREATE INDEX idx_meetups_filters ON meetups (sport, level, city, status);
CREATE INDEX idx_meetups_date    ON meetups (meetup_date);

-- ============================================
-- CLUBS Y PISTAS
-- ============================================
CREATE TABLE clubs (
  id          SERIAL PRIMARY KEY,
  owner_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name        VARCHAR(150) NOT NULL,
  city        VARCHAR(100) NOT NULL,
  address     VARCHAR(255),
  description TEXT,
  phone       VARCHAR(20),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE club_photos (
  id        SERIAL PRIMARY KEY,
  club_id   INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,
  position  INTEGER DEFAULT 0
);

CREATE TABLE club_venues (
  id          SERIAL PRIMARY KEY,
  club_id     INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  city        VARCHAR(100) NOT NULL,
  address     VARCHAR(255),
  description TEXT,
  phone       VARCHAR(20),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE courts (
  id              SERIAL PRIMARY KEY,
  club_id         INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
  venue_id        INTEGER REFERENCES club_venues(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  sport           VARCHAR(50) NOT NULL,
  price_per_hour  NUMERIC(8,2) NOT NULL CHECK (price_per_hour >= 0),
  opening_hour    INTEGER NOT NULL DEFAULT 8 CHECK (opening_hour BETWEEN 0 AND 23),
  closing_hour    INTEGER NOT NULL DEFAULT 22 CHECK (closing_hour BETWEEN 1 AND 24)
);

CREATE TABLE club_followers (
  club_id   INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
  user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  followed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

CREATE INDEX idx_clubs_city      ON clubs (city);
CREATE INDEX idx_venues_club     ON club_venues (club_id);
CREATE INDEX idx_courts_club     ON courts (club_id);
CREATE INDEX idx_courts_venue    ON courts (venue_id);
CREATE INDEX idx_followers_user  ON club_followers (user_id);

-- ============================================
-- RESERVAS Y PAGOS
-- ============================================
CREATE TABLE bookings (
  id                SERIAL PRIMARY KEY,
  court_id          INTEGER REFERENCES courts(id) ON DELETE CASCADE,
  user_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  booking_date      DATE NOT NULL,
  start_hour        INTEGER NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  end_hour          INTEGER NOT NULL CHECK (end_hour BETWEEN 1 AND 24),
  total_price       NUMERIC(8,2) NOT NULL,
  platform_fee      NUMERIC(8,2) NOT NULL,
  club_payout       NUMERIC(8,2) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  stripe_session_id VARCHAR(255),
  created_at        TIMESTAMP DEFAULT NOW()
);

-- Evita doble reserva del mismo slot
-- Solo aplica si la reserva sigue activa (pending/paid)
CREATE UNIQUE INDEX idx_bookings_slot
  ON bookings (court_id, booking_date, start_hour)
  WHERE status != 'cancelled';

CREATE INDEX idx_bookings_user ON bookings (user_id, status);
