// client/src/api/real.js
// Implementación con fetch real al backend Express.
// Auth y users hablan con el backend. Meetups y clubs siguen mockeados
// hasta que terminemos las Fases 2 y 3.

import { mockApi } from './mock.js'

const BASE = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Error ${status}`)
    this.status = status
    this.code = body?.code
    this.body = body
  }
}

async function request(method, path, { body, isFormData } = {}) {
  const opts = { method, credentials: 'include', headers: {} }
  if (body !== undefined) {
    if (isFormData) {
      opts.body = body
    } else {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }
  }
  const res = await fetch(`${BASE}${path}`, opts)
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export const realApi = {
  // ── AUTH ──
  me: async () => {
    try { return await request('GET', '/auth/me') }
    catch (err) {
      if (err.status === 401) return { user: null }   // no logueado, no es error
      throw err
    }
  },
  login: (email, password) => request('POST', '/auth/login', { body: { email, password } }),
  loginAs: () => { throw new Error('loginAs solo está disponible en modo demo (mock)') },
  register: (data) => request('POST', '/auth/register', { body: data }),
  logout: () => request('POST', '/auth/logout'),

  // ── USERS ──
  listUsers: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.sport)    params.set('sport', filters.sport)
    if (filters.level)    params.set('level', filters.level)
    if (filters.city)     params.set('city', filters.city)
    if (filters.province) params.set('province', filters.province)
    const qs = params.toString()
    return request('GET', `/users${qs ? `?${qs}` : ''}`)
  },
  getUser: (username) => request('GET', `/users/${encodeURIComponent(username)}`),
  updateMe: (changes) => {
    // Adaptar nombres: el backend espera mainSport (camelCase)
    const body = { ...changes }
    if (body.main_sport !== undefined) { body.mainSport = body.main_sport; delete body.main_sport }
    return request('PATCH', '/users/me', { body })
  },
  uploadAvatar: (file) => {
    const fd = new FormData()
    fd.append('avatar', file)
    return request('POST', '/users/me/avatar', { body: fd, isFormData: true })
  },

  // ── MEETUPS (real) ──
  listMeetups: (filters = {}) => {
    const p = new URLSearchParams()
    if (filters.sport)    p.set('sport', filters.sport)
    if (filters.level)    p.set('level', filters.level)
    if (filters.city)     p.set('city', filters.city)
    if (filters.province) p.set('province', filters.province)
    const qs = p.toString()
    return request('GET', `/meetups${qs ? `?${qs}` : ''}`)
  },
  getMeetup:    (id) => request('GET', `/meetups/${id}`),
  joinMeetup:   (id) => request('POST', `/meetups/${id}/join`),
  leaveMeetup:  (id) => request('DELETE', `/meetups/${id}/join`),
  createMeetup: (data) => request('POST', '/meetups', { body: { ...data, max_players: Number(data.max_players) } }),
  deleteMeetup: (id) => request('DELETE', `/meetups/${id}`),

  // ── CLUBS (real) ──
  listClubs: (filters = {}) => {
    const p = new URLSearchParams()
    if (filters.city) p.set('city', filters.city)
    const qs = p.toString()
    return request('GET', `/clubs${qs ? `?${qs}` : ''}`)
  },
  getClub: (id) => request('GET', `/clubs/${id}`),
  getAvailability: (courtId, date) => request('GET', `/courts/${courtId}/availability?date=${date}`),

  // ── BOOKINGS (real) ──
  createBooking: (data) => request('POST', '/bookings', { body: data }),
  listMyBookings: () => request('GET', '/bookings/me'),
  getBooking: (id) => request('GET', `/bookings/${id}`),

  // ── FRIENDSHIPS ──
  myFriends:          () => request('GET', '/users/me/friends'),
  friendshipStatus:   (userId) => request('GET', `/users/${userId}/friendship`),
  sendFriendRequest:  (userId) => request('POST', `/users/${userId}/friend-request`),
  acceptFriend:       (userId) => request('POST', `/users/${userId}/friend-accept`),
  removeFriend:       (userId) => request('DELETE', `/users/${userId}/friend`),

  // ── MEETUPS PROPIOS ──
  myMeetups:          () => request('GET', '/users/me/meetups'),

  // ── CLUBES PROPIOS ──
  myClubs:            () => request('GET', '/clubs/me'),
  myFollowingClubs:   () => request('GET', '/clubs/me/following'),
  createOwnClub:      (b) => request('POST', '/clubs', { body: b }),
  updateOwnClub:      (id, b) => request('PATCH', `/clubs/${id}`, { body: b }),
  followClub:         (id) => request('POST', `/clubs/${id}/follow`),
  unfollowClub:       (id) => request('DELETE', `/clubs/${id}/follow`),
  clubFollowers:      (id) => request('GET', `/clubs/${id}/followers`),
  clubBookings:       (id) => request('GET', `/clubs/${id}/bookings`),

  // ── VENUES ──
  listVenues:         (clubId) => request('GET', `/clubs/${clubId}/venues`),
  createVenue:        (clubId, b) => request('POST', `/clubs/${clubId}/venues`, { body: b }),
  updateVenue:        (id, b) => request('PATCH', `/venues/${id}`, { body: b }),
  deleteVenue:        (id) => request('DELETE', `/venues/${id}`),
  createCourt:        (venueId, b) => request('POST', `/venues/${venueId}/courts`, { body: b }),
  updateCourt:        (id, b) => request('PATCH', `/courts/${id}`, { body: b }),
  deleteCourt:        (id) => request('DELETE', `/courts/${id}`),

  // ── ADMIN ──
  adminStats:        () => request('GET', '/admin/stats'),
  adminListUsers:    () => request('GET', '/admin/users'),
  adminCreateUser:   (b) => request('POST', '/admin/users', { body: b }),
  adminUpdateUser:   (id, b) => request('PATCH', `/admin/users/${id}`, { body: b }),
  adminDeleteUser:   (id) => request('DELETE', `/admin/users/${id}`),
  adminListClubs:    () => request('GET', '/admin/clubs'),
  adminCreateClub:   (b) => request('POST', '/admin/clubs', { body: b }),
  adminUpdateClub:   (id, b) => request('PATCH', `/admin/clubs/${id}`, { body: b }),
  adminDeleteClub:   (id) => request('DELETE', `/admin/clubs/${id}`),
  adminListMeetups:  () => request('GET', '/admin/meetups'),
  adminCreateMeetup: (b) => request('POST', '/admin/meetups', { body: b }),
  adminUpdateMeetup: (id, b) => request('PATCH', `/admin/meetups/${id}`, { body: b }),
  adminDeleteMeetup: (id) => request('DELETE', `/admin/meetups/${id}`),
}
