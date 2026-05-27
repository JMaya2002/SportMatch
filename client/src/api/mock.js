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

// ── Estado en memoria para la demo ───────────────────────────────────────────
// Persiste mientras la pestaña esté abierta; se reinicia al recargar.

// Amistades: { requesterId, receiverId, status: 'pending'|'accepted' }
// Pre-poblado para que la demo sea interesante desde el primer momento.
let FRIEND_REQUESTS = [
  { requesterId: 2, receiverId: 1, status: 'accepted' }, // elena ↔ joel: amigos
  { requesterId: 3, receiverId: 5, status: 'pending' },  // carlos → alex: solicitud enviada
  { requesterId: 8, receiverId: 4, status: 'pending' },  // sara → marta: solicitud recibida
]

function getFriendRow(a, b) {
  return FRIEND_REQUESTS.find(f =>
    (f.requesterId === a && f.receiverId === b) ||
    (f.requesterId === b && f.receiverId === a)
  )
}

function calcFriendStatus(myId, otherId) {
  if (myId === otherId) return 'self'
  const row = getFriendRow(myId, otherId)
  if (!row) return 'none'
  if (row.status === 'accepted') return 'friends'
  return row.requesterId === myId ? 'sent' : 'received'
}

// Seguidores de clubs: Set de `${userId}_${clubId}`
const CLUB_FOLLOWS = new Set()
const BASE_FOLLOWERS = { 1: 47, 2: 23, 3: 15, 4: 8 }

function clubFollowCount(clubId) {
  let n = BASE_FOLLOWERS[clubId] || 0
  for (const key of CLUB_FOLLOWS) {
    if (Number(key.split('_')[1]) === clubId) n++
  }
  return n
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
    if (filters.city)     users = users.filter(u => u.city.toLowerCase().includes(filters.city.toLowerCase()))
    if (filters.province) users = users.filter(u => u.province === filters.province)
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
    if (filters.city)     meetups = meetups.filter(m => m.city.toLowerCase().includes(filters.city.toLowerCase()))
    if (filters.province) meetups = meetups.filter(m => m.province === filters.province)
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
    const me = getSession()
    const is_following = me ? CLUB_FOLLOWS.has(`${me.id}_${club.id}`) : false
    return delay({
      club: { ...club, venues: [], followers_count: clubFollowCount(club.id), is_following, is_owner: false },
    })
  },
  getAvailability: (courtId, date) => {
    return delay({ courtId, date, slots: mockAvailability(courtId, date) })
  },
  createBooking: () => {
    return delay({ bookingId: Math.floor(Math.random() * 10000), checkoutUrl: '#demo' })
  },

  // ── Amistades (con estado en memoria) ──
  myFriends: () => {
    const me = getSession()
    if (!me) return delay({ friends: [], received: [], sent: [] })
    const friends = [], received = [], sent = []
    for (const row of FRIEND_REQUESTS) {
      const isMe = row.requesterId === me.id || row.receiverId === me.id
      if (!isMe) continue
      const otherId = row.requesterId === me.id ? row.receiverId : row.requesterId
      const u = MOCK_USERS.find(u => u.id === otherId)
      if (!u) continue
      if (row.status === 'accepted')             friends.push(u)
      else if (row.receiverId === me.id)         received.push(u)
      else                                        sent.push(u)
    }
    return delay({ friends, received, sent })
  },
  friendshipStatus: (userId) => {
    const me = getSession()
    if (!me) return delay({ status: 'none' })
    return delay({ status: calcFriendStatus(me.id, Number(userId)) })
  },
  sendFriendRequest: (userId) => {
    const me = getSession()
    if (!me) throw new Error('No autenticado')
    const otherId = Number(userId)
    if (getFriendRow(me.id, otherId)) throw new Error('Ya existe una relación')
    FRIEND_REQUESTS.push({ requesterId: me.id, receiverId: otherId, status: 'pending' })
    return delay({ status: 'sent' })
  },
  acceptFriend: (userId) => {
    const me = getSession()
    if (!me) throw new Error('No autenticado')
    const row = getFriendRow(me.id, Number(userId))
    if (row) row.status = 'accepted'
    return delay({ status: 'friends' })
  },
  removeFriend: (userId) => {
    const me = getSession()
    if (!me) return delay({ ok: true })
    const otherId = Number(userId)
    FRIEND_REQUESTS = FRIEND_REQUESTS.filter(f =>
      !((f.requesterId === me.id && f.receiverId === otherId) ||
        (f.requesterId === otherId && f.receiverId === me.id))
    )
    return delay({ ok: true })
  },

  // ── Clubs propios / seguidos (con estado en memoria) ──
  myMeetups:        () => delay({ created: [], joined: [] }),
  myClubs:          () => delay({ clubs: [] }),
  myFollowingClubs: () => {
    const me = getSession()
    if (!me) return delay({ clubs: [] })
    const clubs = MOCK_CLUBS
      .filter(c => CLUB_FOLLOWS.has(`${me.id}_${c.id}`))
      .map(c => ({ ...c, is_following: true, followers_count: clubFollowCount(c.id) }))
    return delay({ clubs })
  },
  createOwnClub:    () => { throw new Error('Crear clubes requiere backend real') },
  updateOwnClub:    () => { throw new Error('Editar clubes requiere backend real') },
  followClub: (id) => {
    const me = getSession()
    if (me) CLUB_FOLLOWS.add(`${me.id}_${Number(id)}`)
    return delay({ ok: true })
  },
  unfollowClub: (id) => {
    const me = getSession()
    if (me) CLUB_FOLLOWS.delete(`${me.id}_${Number(id)}`)
    return delay({ ok: true })
  },
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
