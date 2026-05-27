// client/src/mock/data.js
// Datos de demostración. En la versión final se reemplazan por llamadas reales al backend.

export const MOCK_USERS = [
  { id: 1, username: 'joel',    name: 'Joel Maya',       age: 28, city: 'Barcelona', main_sport: 'padel',      level: 'intermedio',
    avatar_url: 'https://i.pravatar.cc/200?img=12', bio: 'Pádel los sábados por la mañana. Busco compañeros para subir nivel.' },
  { id: 2, username: 'elena',   name: 'Elena Soler',     age: 26, city: 'Barcelona', main_sport: 'tenis',     level: 'experto',
    avatar_url: 'https://i.pravatar.cc/200?img=45', bio: 'Tenis competitivo. Disponible tardes entre semana.' },
  { id: 3, username: 'carlos',  name: 'Carlos Ruiz',     age: 34, city: 'Madrid',    main_sport: 'futbol',     level: 'intermedio',
    avatar_url: 'https://i.pravatar.cc/200?img=33', bio: 'Fútbol 7 los miércoles. Capitán del equipo Real Polígono.' },
  { id: 4, username: 'marta',   name: 'Marta López',     age: 22, city: 'Valencia',  main_sport: 'running',    level: 'principiante',
    avatar_url: 'https://i.pravatar.cc/200?img=47', bio: 'Empezando a correr. Busco grupo para 5K los domingos.' },
  { id: 5, username: 'alex',    name: 'Alex Torres',     age: 30, city: 'Barcelona', main_sport: 'baloncesto', level: 'experto',
    avatar_url: 'https://i.pravatar.cc/200?img=15', bio: 'Baloncesto 3x3. Pista del parque de la Ciutadella.' },
  { id: 6, username: 'lucia',   name: 'Lucía García',    age: 29, city: 'Madrid',    main_sport: 'padel',      level: 'avanzado',
    avatar_url: 'https://i.pravatar.cc/200?img=49', bio: 'Pádel competitivo, busco partidos de nivel.' },
  { id: 7, username: 'diego',   name: 'Diego Hernández', age: 31, city: 'Barcelona', main_sport: 'ciclismo',   level: 'intermedio',
    avatar_url: 'https://i.pravatar.cc/200?img=53', bio: 'Salidas en grupo por Collserola los fines de semana.' },
  { id: 8, username: 'sara',    name: 'Sara Martínez',   age: 25, city: 'Valencia',  main_sport: 'fitness',    level: 'intermedio',
    avatar_url: 'https://i.pravatar.cc/200?img=24', bio: 'Crossfit y funcional. Compañeros de gym bienvenidos.' },
  { id: 9, username: 'pablo',   name: 'Pablo Sánchez',   age: 27, city: 'Sevilla',   main_sport: 'senderismo', level: 'avanzado',
    avatar_url: 'https://i.pravatar.cc/200?img=68', bio: 'Rutas largas en Sierra Norte. Nivel exigente.' },
  { id: 10, username: 'nuria',  name: 'Nuria Vidal',     age: 33, city: 'Barcelona', main_sport: 'tenis',      level: 'intermedio',
    avatar_url: 'https://i.pravatar.cc/200?img=44', bio: 'Tenis dobles, busco pareja estable para ligas amateur.' },
]

export const MOCK_MEETUPS = [
  { id: 1, creator: MOCK_USERS[0], title: 'Partido de pádel — domingo mañana',
    sport: 'padel', level: 'intermedio', city: 'Barcelona', location: 'Club Pádel Sant Cugat',
    meetup_date: '2026-05-30T10:00:00', max_players: 4, current_players: 2,
    description: 'Buscamos 2 jugadores nivel intermedio para partido amistoso de 1h30. Pista exterior, llevamos pelotas nuevas.' },
  { id: 2, creator: MOCK_USERS[2], title: 'Fútbol 7 los miércoles',
    sport: 'futbol', level: 'intermedio', city: 'Madrid', location: 'Campo municipal de Carabanchel',
    meetup_date: '2026-05-27T19:00:00', max_players: 14, current_players: 11,
    description: 'Partido semanal. Faltan 3 jugadores para esta semana. Llevamos petos.' },
  { id: 3, creator: MOCK_USERS[3], title: 'Carrera 5K — Domingo del Turia',
    sport: 'running', level: 'principiante', city: 'Valencia', location: 'Jardín del Turia',
    meetup_date: '2026-06-01T09:00:00', max_players: 20, current_players: 7,
    description: 'Trote suave de 5K por el cauce. Ritmo cómodo (~6:30 min/km). Cualquier nivel bienvenido.' },
  { id: 4, creator: MOCK_USERS[4], title: '3x3 Baloncesto en la Ciutadella',
    sport: 'baloncesto', level: 'avanzado', city: 'Barcelona', location: 'Parc de la Ciutadella',
    meetup_date: '2026-05-28T18:30:00', max_players: 6, current_players: 4,
    description: 'Dos contra dos / tres contra tres según vengamos. Faltan 2.' },
  { id: 5, creator: MOCK_USERS[6], title: 'Ruta ciclista por Collserola',
    sport: 'ciclismo', level: 'intermedio', city: 'Barcelona', location: 'Salida desde Vallvidrera',
    meetup_date: '2026-05-31T08:00:00', max_players: 10, current_players: 3,
    description: 'Ruta de 45km, ~700m desnivel. Ritmo conversado. Café de vuelta en Vallvidrera.' },
  { id: 6, creator: MOCK_USERS[1], title: 'Tenis nivel avanzado',
    sport: 'tenis', level: 'avanzado', city: 'Barcelona', location: 'Club Tennis Pompeia',
    meetup_date: '2026-05-29T17:00:00', max_players: 4, current_players: 2,
    description: 'Dobles con jugadores de torneo amateur. Nivel mínimo: 4ª categoría.' },
]

export const MOCK_CLUBS = [
  {
    id: 1, name: 'Club Pádel Sant Cugat', city: 'Barcelona',
    address: 'Av. Diagonal 234, Sant Cugat',
    description: 'Club premium con 8 pistas de cristal, vestuarios reformados y cafetería.',
    photos: [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
    ],
    courts: [
      { id: 1, name: 'Pista 1 — Cristal', sport: 'padel', price_per_hour: 16 },
      { id: 2, name: 'Pista 2 — Cristal', sport: 'padel', price_per_hour: 16 },
      { id: 3, name: 'Pista 3 — Cubierta', sport: 'padel', price_per_hour: 20 },
    ],
  },
  {
    id: 2, name: 'Tennis Club Pompeia', city: 'Barcelona',
    address: 'Carrer Foixarda 2, Barcelona',
    description: 'Club histórico con 12 pistas de tierra batida en plena Montjuïc.',
    photos: [
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800',
      'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800',
    ],
    courts: [
      { id: 4, name: 'Pista Central', sport: 'tenis', price_per_hour: 22 },
      { id: 5, name: 'Pista 2', sport: 'tenis', price_per_hour: 18 },
      { id: 6, name: 'Pista 3', sport: 'tenis', price_per_hour: 18 },
    ],
  },
  {
    id: 3, name: 'Polideportivo Carabanchel', city: 'Madrid',
    address: 'Calle del Camino Viejo de Leganés 56',
    description: 'Instalaciones públicas con pistas de fútbol 7, baloncesto y pádel a precios populares.',
    photos: [
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    ],
    courts: [
      { id: 7, name: 'Campo F7 — Césped', sport: 'futbol', price_per_hour: 40 },
      { id: 8, name: 'Cancha baloncesto', sport: 'baloncesto', price_per_hour: 12 },
      { id: 9, name: 'Pádel 1', sport: 'padel', price_per_hour: 14 },
    ],
  },
  {
    id: 4, name: 'Fitness Hub Valencia', city: 'Valencia',
    address: 'Av. del Puerto 145',
    description: 'Gimnasio boutique con clases de funcional, crossfit y spinning. Sala libre 24/7.',
    photos: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
    ],
    courts: [
      { id: 10, name: 'Box Crossfit', sport: 'fitness', price_per_hour: 8 },
      { id: 11, name: 'Sala spinning', sport: 'fitness', price_per_hour: 10 },
    ],
  },
]

// Disponibilidad mockeada: genera 14 slots por día (8h-22h) marcando aleatoriamente algunos como ocupados
export function mockAvailability(courtId, date) {
  const slots = []
  // Hash determinístico para que los mismos slots sean consistentes entre renders
  const seed = (courtId * 31 + new Date(date).getDate()) % 100
  for (let h = 8; h < 22; h++) {
    const occupied = ((h * 7 + seed) % 5) === 0  // ~20% ocupados, determinístico
    slots.push({ hour: h, available: !occupied })
  }
  return slots
}
