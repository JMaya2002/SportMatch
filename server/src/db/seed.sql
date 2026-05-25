-- server/src/db/seed.sql
-- Usuarios de prueba. Password de todos: "test1234"
-- Hash bcrypt precomputado de "test1234"

INSERT INTO users (username, email, password_hash, name, age, city, main_sport, level, age_confirmed)
VALUES
  ('joel',    'joel@test.com',    '$2b$10$55BVJmNrNvF8gZnDOu25gOMiMZgoGDjGNkCIrXcAAt2LdK57MpCxe', 'Joel Maya',     28, 'Barcelona', 'padel',      'intermedio',   true),
  ('elena',   'elena@test.com',   '$2b$10$55BVJmNrNvF8gZnDOu25gOMiMZgoGDjGNkCIrXcAAt2LdK57MpCxe', 'Elena Soler',   26, 'Barcelona', 'tenis',      'avanzado',     true),
  ('carlos',  'carlos@test.com',  '$2b$10$55BVJmNrNvF8gZnDOu25gOMiMZgoGDjGNkCIrXcAAt2LdK57MpCxe', 'Carlos Ruiz',   34, 'Madrid',    'futbol',     'intermedio',   true),
  ('marta',   'marta@test.com',   '$2b$10$55BVJmNrNvF8gZnDOu25gOMiMZgoGDjGNkCIrXcAAt2LdK57MpCxe', 'Marta López',   22, 'Valencia',  'running',    'principiante', true),
  ('alex',    'alex@test.com',    '$2b$10$55BVJmNrNvF8gZnDOu25gOMiMZgoGDjGNkCIrXcAAt2LdK57MpCxe', 'Alex Torres',   30, 'Barcelona', 'baloncesto', 'avanzado',     true);

-- Admin de prueba: joel (id=1) tiene acceso al panel
UPDATE users SET is_admin = true WHERE username = 'joel';

-- Algunas bios
UPDATE users SET bio = 'Pádel los sábados por la mañana. Busco compañeros para subir nivel.' WHERE username = 'joel';
UPDATE users SET bio = 'Tenis competitivo. Disponible tardes entre semana.'              WHERE username = 'elena';
UPDATE users SET bio = 'Fútbol 7 los miércoles. Capitán del equipo Real Polígono.'      WHERE username = 'carlos';
UPDATE users SET bio = 'Empezando a correr. Busco grupo para 5K los domingos.'          WHERE username = 'marta';
UPDATE users SET bio = 'Baloncesto 3x3. Pista del parque de la Ciutadella.'             WHERE username = 'alex';

-- Amistades de prueba
INSERT INTO friendships (requester_id, receiver_id, status) VALUES
  (1, 2, 'accepted'),   -- joel ↔ elena amigos
  (1, 5, 'accepted'),   -- joel ↔ alex amigos
  (3, 1, 'pending'),    -- carlos → joel pendiente
  (4, 1, 'pending');    -- marta  → joel pendiente

-- ============================================
-- QUEDADAS DE PRUEBA
-- ============================================
INSERT INTO meetups (creator_id, title, description, sport, level, city, location, meetup_date, max_players)
VALUES
  (1, 'Partido de pádel — domingo mañana',
   'Buscamos 2 jugadores nivel intermedio para partido amistoso. Llevamos pelotas.',
   'padel', 'intermedio', 'Barcelona', 'Club Pádel Sant Cugat',
   NOW() + INTERVAL '5 days' + INTERVAL '10 hours', 4),
  (3, 'Fútbol 7 los miércoles',
   'Partido semanal. Faltan jugadores para esta semana. Llevamos petos.',
   'futbol', 'intermedio', 'Madrid', 'Campo municipal de Carabanchel',
   NOW() + INTERVAL '2 days' + INTERVAL '19 hours', 14),
  (4, 'Carrera 5K — Domingo del Turia',
   'Trote suave de 5K por el cauce. Ritmo cómodo (~6:30 min/km). Cualquier nivel bienvenido.',
   'running', 'principiante', 'Valencia', 'Jardín del Turia',
   NOW() + INTERVAL '6 days' + INTERVAL '9 hours', 20);

-- El creador es automáticamente participante
INSERT INTO meetup_participants (meetup_id, user_id) VALUES (1, 1), (2, 3), (3, 4);

-- ============================================
-- CLUBS DE PRUEBA
-- ============================================
INSERT INTO clubs (owner_id, name, city, address, description, phone) VALUES
  (1, 'Club Pádel Sant Cugat',  'Barcelona', 'Av. Diagonal 234, Sant Cugat', 'Club premium con 8 pistas de cristal, vestuarios reformados y cafetería.', '932345678'),
  (2, 'Tennis Club Pompeia',    'Barcelona', 'Carrer Foixarda 2, Barcelona', 'Club histórico con 12 pistas de tierra batida en Montjuïc.',              '932112233'),
  (3, 'Polideportivo Carabanchel', 'Madrid', 'Calle del Camino Viejo de Leganés 56', 'Instalaciones públicas con fútbol 7, baloncesto y pádel a precios populares.', '914556677'),
  (4, 'Fitness Hub Valencia',   'Valencia',  'Av. del Puerto 145', 'Gimnasio boutique con clases de funcional, crossfit y spinning.', '963778899');

INSERT INTO club_photos (club_id, url, position) VALUES
  (1, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', 0),
  (1, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800', 1),
  (2, 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800', 0),
  (2, 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800', 1),
  (3, 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800', 0),
  (3, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', 1),
  (4, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 0),
  (4, 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800', 1);

-- Un recinto principal por club (mismos datos del club)
INSERT INTO club_venues (id, club_id, name, city, address) VALUES
  (1, 1, 'Sede principal', 'Barcelona', 'Av. Diagonal 234, Sant Cugat'),
  (2, 2, 'Sede principal', 'Barcelona', 'Carrer Foixarda 2, Barcelona'),
  (3, 3, 'Sede principal', 'Madrid',    'Calle del Camino Viejo de Leganés 56'),
  (4, 4, 'Sede principal', 'Valencia',  'Av. del Puerto 145');
SELECT setval('club_venues_id_seq', 4);

INSERT INTO courts (club_id, venue_id, name, sport, price_per_hour, opening_hour, closing_hour) VALUES
  (1, 1, 'Pista 1 — Cristal',  'padel',      16, 8, 22),
  (1, 1, 'Pista 2 — Cristal',  'padel',      16, 8, 22),
  (1, 1, 'Pista 3 — Cubierta', 'padel',      20, 8, 22),
  (2, 2, 'Pista Central',      'tenis',      22, 8, 22),
  (2, 2, 'Pista 2',            'tenis',      18, 8, 22),
  (2, 2, 'Pista 3',            'tenis',      18, 8, 22),
  (3, 3, 'Campo F7 — Césped',  'futbol',     40, 9, 23),
  (3, 3, 'Cancha baloncesto',  'baloncesto', 12, 9, 23),
  (3, 3, 'Pádel 1',            'padel',      14, 9, 23),
  (4, 4, 'Box Crossfit',       'fitness',     8, 7, 22),
  (4, 4, 'Sala spinning',      'fitness',    10, 7, 22);

-- Algunos seguidores de clubes
INSERT INTO club_followers (club_id, user_id) VALUES
  (1, 2), (1, 5), (2, 1), (3, 5);
