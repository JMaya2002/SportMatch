// client/src/api/mock.js
// Implementación con datos en memoria. Se usa cuando VITE_API_MODE=mock
// (por ejemplo en la demo de GitHub Pages, donde no hay backend).

import { MOCK_USERS, MOCK_MEETUPS, MOCK_CLUBS, mockAvailability } from '../mock/data.js'

const DELAY = 250
const delay = v => new Promise(r => setTimeout(() => r(v), DELAY))

const SESSION_KEY = 'sportmatch_demo_user'
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
}
function setSession(user) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  else localStorage.removeItem(SESSION_KEY)
}

export const mockApi = {
  me: () => delay({ user: getSession() }),

  login: (email) => {
    const user = MOCK_USERS.find(u => u.username === email.split('@')[0] || email.includes(u.username))
    if (!user) throw new Error('Credenciales inválidas')
    setSession(user)
    return delay({ user })
  },

  loginAs: (username) => {
    const user = MOCK_USERS.find(u => u.username === username)
    if (!user) throw new Error('Usuario no encontrado')
    setSession(user)
    return delay({ user })
  },

  register: (data) => {
    const newUser = {
      id: MOCK_USERS.length + 1,
      username: data.username,
      name: data.name,
      age: Number(data.age),
      city: data.city,
      main_sport: data.mainSport,
      level: data.level,
      avatar_url: `https://i.pravatar.cc/200?u=${data.username}`,
      bio: '¡Hola! Soy nuevo en SportMatch.',
    }
    MOCK_USERS.push(newUser)
    setSession(newUser)
    return delay({ user: newUser })
  },

  logout: () => { setSession(null); return delay({ ok: true }) },

  listUsers: (filters = {}) => {
    let users = [...MOCK_USERS]
    if (filters.sport) users = users.filter(u => u.main_sport === filters.sport)
    if (filters.level) users = users.filter(u => u.level === filters.level)
    if (filters.city)  users = users.filter(u => u.city.toLowerCase().includes(filters.city.toLowerCase()))
    return delay({ users })
  },

  getUser: (username) => {
    const user = MOCK_USERS.find(u => u.username === username)
    if (!user) throw new Error('Usuario no encontrado')
    return delay({ user })
  },

  updateMe: (changes) => {
    const current = getSession()
    if (!current) throw new Error('No autenticado')
    const updated = { ...current, ...changes }
    setSession(updated)
    const idx = MOCK_USERS.findIndex(u => u.id === current.id)
    if (idx >= 0) MOCK_USERS[idx] = updated
    return delay({ user: updated })
  },

  // ── MEETUPS / CLUBS (siempre mock por ahora, Fase 2 y 3 pendientes) ──
  listMeetups: (filters = {}) => {
    let meetups = [...MOCK_MEETUPS]
    if (filters.sport) meetups = meetups.filter(m => m.sport === filters.sport)
    if (filters.level) meetups = meetups.filter(m => m.level === filters.level)
    if (filters.city)  meetups = meetups.filter(m => m.city.toLowerCase().includes(filters.city.toLowerCase()))
    return delay({ meetups })
  },
  getMeetup: (id) => {
    const meetup = MOCK_MEETUPS.find(m => m.id === Number(id))
    if (!meetup) throw new Error('Quedada no encontrada')
    return delay({ meetup })
  },
  joinMeetup: (id) => {
    const meetup = MOCK_MEETUPS.find(m => m.id === Number(id))
    if (meetup && meetup.current_players < meetup.max_players) meetup.current_players++
    return delay({ ok: true })
  },
  createMeetup: (data) => {
    const current = getSession()
    const newMeetup = {
      id: MOCK_MEETUPS.length + 1,
      creator: current || MOCK_USERS[0],
      title: data.title, sport: data.sport, level: data.level,
      city: data.city, location: data.location,
      meetup_date: data.meetup_date,
      max_players: Number(data.max_players),
      current_players: 1,
      description: data.description,
    }
    MOCK_MEETUPS.unshift(newMeetup)
    return delay({ meetup: newMeetup })
  },
  listClubs: (filters = {}) => {
    let clubs = [...MOCK_CLUBS]
    if (filters.city) clubs = clubs.filter(c => c.city.toLowerCase().includes(filters.city.toLowerCase()))
    return delay({ clubs })
  },
  getClub: (id) => {
    const club = MOCK_CLUBS.find(c => c.id === Number(id))
    if (!club) throw new Error('Club no encontrado')
    return delay({ club })
  },
  getAvailability: (courtId, date) => {
    return delay({ courtId, date, slots: mockAvailability(courtId, date) })
  },
  createBooking: () => {
    return delay({ bookingId: Math.floor(Math.random() * 10000), checkoutUrl: '#demo' })
  },

  // ── Stubs sociales/owner (la demo mock no tiene backend; devolvemos vacíos) ──
  myFriends:        () => delay({ friends: [], received: [], sent: [] }),
  friendshipStatus: () => delay({ status: 'none' }),
  sendFriendRequest: () => delay({ status: 'sent' }),
  acceptFriend:     () => delay({ status: 'friends' }),
  removeFriend:     () => delay({ ok: true }),
  myMeetups:        () => delay({ created: [], joined: [] }),
  myClubs:          () => delay({ clubs: [] }),
  myFollowingClubs: () => delay({ clubs: [] }),
  createOwnClub:    () => { throw new Error('Crear clubes requiere backend real') },
  updateOwnClub:    () => { throw new Error('Editar clubes requiere backend real') },
  followClub:       () => delay({ ok: true }),
  unfollowClub:     () => delay({ ok: true }),
  clubFollowers:    () => delay({ followers: [] }),
  clubBookings:     () => delay({ bookings: [] }),
  listVenues:       () => delay({ venues: [] }),
  createVenue:      () => { throw new Error('Requiere backend real') },
  updateVenue:      () => { throw new Error('Requiere backend real') },
  deleteVenue:      () => delay({ ok: true }),
  createCourt:      () => { throw new Error('Requiere backend real') },
  updateCourt:      () => { throw new Error('Requiere backend real') },
  deleteCourt:      () => delay({ ok: true }),
}
