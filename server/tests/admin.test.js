// server/tests/admin.test.js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/index.js'
import { createTestUser } from './helpers.js'

async function loginAs(app, user) {
  const res = await request(app).post('/api/auth/login').send({
    email: user.email, password: user.plainPassword,
  })
  return res.headers['set-cookie']
}

describe('Admin — protección', () => {
  it('sin auth devuelve 401', async () => {
    const app = createApp()
    const res = await request(app).get('/api/admin/users')
    expect(res.status).toBe(401)
  })

  it('usuario normal devuelve 403', async () => {
    const user = await createTestUser({ username: 'p1', email: 'p1@t.com' })
    const app = createApp()
    const cookie = await loginAs(app, user)
    const res = await request(app).get('/api/admin/users').set('Cookie', cookie)
    expect(res.status).toBe(403)
  })

  it('admin pasa', async () => {
    const admin = await createTestUser({ username: 'adm1', email: 'adm1@t.com', is_admin: true })
    const app = createApp()
    const cookie = await loginAs(app, admin)
    const res = await request(app).get('/api/admin/users').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.users)).toBe(true)
  })
})

describe('Admin — CRUD users', () => {
  async function asAdmin() {
    const admin = await createTestUser({ username: 'adm', email: 'adm@t.com', is_admin: true })
    const app = createApp()
    const cookie = await loginAs(app, admin)
    return { app, cookie, admin }
  }

  it('crea, edita y borra usuario', async () => {
    const { app, cookie } = await asAdmin()
    const create = await request(app).post('/api/admin/users').set('Cookie', cookie).send({
      username: 'nuevo', email: 'nuevo@t.com', password: 'abcd1234',
      name: 'Nuevo', age: 25, city: 'BCN',
      mainSport: 'padel', level: 'intermedio',
    })
    expect(create.status).toBe(201)
    const id = create.body.user.id

    const patch = await request(app).patch(`/api/admin/users/${id}`).set('Cookie', cookie).send({ city: 'Madrid' })
    expect(patch.status).toBe(200)
    expect(patch.body.user.city).toBe('Madrid')

    const del = await request(app).delete(`/api/admin/users/${id}`).set('Cookie', cookie)
    expect(del.status).toBe(204)
  })
})

describe('Admin — CRUD clubs', () => {
  it('crea, edita y borra club', async () => {
    const admin = await createTestUser({ username: 'adm2', email: 'adm2@t.com', is_admin: true })
    const app = createApp()
    const cookie = await loginAs(app, admin)

    const create = await request(app).post('/api/admin/clubs').set('Cookie', cookie).send({
      name: 'Club Test', city: 'Barcelona', address: 'X', description: 'Y', phone: '600',
    })
    expect(create.status).toBe(201)
    const id = create.body.club.id

    const patch = await request(app).patch(`/api/admin/clubs/${id}`).set('Cookie', cookie).send({ city: 'Valencia' })
    expect(patch.status).toBe(200)
    expect(patch.body.club.city).toBe('Valencia')

    const list = await request(app).get('/api/admin/clubs').set('Cookie', cookie)
    expect(list.body.clubs.find(c => c.id === id)).toBeTruthy()

    const del = await request(app).delete(`/api/admin/clubs/${id}`).set('Cookie', cookie)
    expect(del.status).toBe(204)
  })
})

describe('Admin — CRUD meetups', () => {
  it('crea, edita y borra quedada', async () => {
    const admin = await createTestUser({ username: 'adm3', email: 'adm3@t.com', is_admin: true })
    const app = createApp()
    const cookie = await loginAs(app, admin)

    const create = await request(app).post('/api/admin/meetups').set('Cookie', cookie).send({
      creator_id: admin.id,
      title: 'Quedada admin',
      sport: 'padel', level: 'intermedio',
      city: 'Barcelona', location: 'Club X',
      meetup_date: '2027-06-01T18:00:00',
      max_players: 4,
    })
    expect(create.status).toBe(201)
    const id = create.body.meetup.id

    const patch = await request(app).patch(`/api/admin/meetups/${id}`).set('Cookie', cookie).send({ title: 'Editada' })
    expect(patch.status).toBe(200)
    expect(patch.body.meetup.title).toBe('Editada')

    const del = await request(app).delete(`/api/admin/meetups/${id}`).set('Cookie', cookie)
    expect(del.status).toBe(204)
  })
})

describe('Admin — stats', () => {
  it('devuelve resumen', async () => {
    const admin = await createTestUser({ username: 'adm4', email: 'adm4@t.com', is_admin: true })
    const app = createApp()
    const cookie = await loginAs(app, admin)
    const res = await request(app).get('/api/admin/stats').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(typeof res.body.stats.users).toBe('number')
    expect(typeof res.body.stats.clubs).toBe('number')
  })
})
