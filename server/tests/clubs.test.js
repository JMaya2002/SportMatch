// server/tests/clubs.test.js
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

async function createClub(app, cookie, body = {}) {
  return request(app).post('/api/clubs').set('Cookie', cookie).send({
    name: 'Mi Club', city: 'Barcelona', ...body,
  })
}

describe('Clubs — follow', () => {
  it('seguir y dejar de seguir un club', async () => {
    const owner = await createTestUser({ username: 'co', email: 'co@t.com' })
    const fan   = await createTestUser({ username: 'cf', email: 'cf@t.com' })
    const app = createApp()
    const co = await loginAs(app, owner)
    const cf = await loginAs(app, fan)
    const create = await createClub(app, co)
    const id = create.body.club.id

    const follow = await request(app).post(`/api/clubs/${id}/follow`).set('Cookie', cf)
    expect(follow.status).toBe(204)

    const detail = await request(app).get(`/api/clubs/${id}`).set('Cookie', cf)
    expect(detail.body.club.is_following).toBe(true)
    expect(detail.body.club.followers_count).toBe(1)

    const unfollow = await request(app).delete(`/api/clubs/${id}/follow`).set('Cookie', cf)
    expect(unfollow.status).toBe(204)
    const detail2 = await request(app).get(`/api/clubs/${id}`).set('Cookie', cf)
    expect(detail2.body.club.is_following).toBe(false)
  })
})

describe('Clubs — solo owner puede editar', () => {
  it('otro usuario recibe 403 al editar', async () => {
    const owner = await createTestUser({ username: 'eo', email: 'eo@t.com' })
    const other = await createTestUser({ username: 'eot', email: 'eot@t.com' })
    const app = createApp()
    const co = await loginAs(app, owner)
    const cot = await loginAs(app, other)
    const create = await createClub(app, co)
    const id = create.body.club.id
    const res = await request(app).patch(`/api/clubs/${id}`).set('Cookie', cot).send({ name: 'Hack' })
    expect(res.status).toBe(403)
  })

  it('owner puede listar /clubs/me', async () => {
    const owner = await createTestUser({ username: 'mo', email: 'mo@t.com' })
    const app = createApp()
    const co = await loginAs(app, owner)
    await createClub(app, co, { name: 'Uno' })
    await createClub(app, co, { name: 'Dos' })
    const res = await request(app).get('/api/clubs/me').set('Cookie', co)
    expect(res.status).toBe(200)
    expect(res.body.clubs).toHaveLength(2)
  })
})

describe('Venues + courts CRUD', () => {
  it('owner crea venue y court', async () => {
    const owner = await createTestUser({ username: 'vo', email: 'vo@t.com' })
    const app = createApp()
    const co = await loginAs(app, owner)
    const club = (await createClub(app, co)).body.club

    const venue = await request(app).post(`/api/clubs/${club.id}/venues`).set('Cookie', co).send({
      name: 'Sede A', city: 'Barcelona', address: 'Av X',
    })
    expect(venue.status).toBe(201)
    const venueId = venue.body.venue.id

    const court = await request(app).post(`/api/venues/${venueId}/courts`).set('Cookie', co).send({
      name: 'Pista 1', sport: 'padel', price_per_hour: 15,
    })
    expect(court.status).toBe(201)
    expect(Number(court.body.court.price_per_hour)).toBe(15)

    const patch = await request(app).patch(`/api/courts/${court.body.court.id}`).set('Cookie', co).send({
      price_per_hour: 20,
    })
    expect(patch.status).toBe(200)
    expect(Number(patch.body.court.price_per_hour)).toBe(20)

    const del = await request(app).delete(`/api/courts/${court.body.court.id}`).set('Cookie', co)
    expect(del.status).toBe(204)

    const delV = await request(app).delete(`/api/venues/${venueId}`).set('Cookie', co)
    expect(delV.status).toBe(204)
  })

  it('no-owner recibe 403', async () => {
    const owner = await createTestUser({ username: 'voo', email: 'voo@t.com' })
    const other = await createTestUser({ username: 'voot', email: 'voot@t.com' })
    const app = createApp()
    const co  = await loginAs(app, owner)
    const cot = await loginAs(app, other)
    const club = (await createClub(app, co)).body.club
    const res = await request(app).post(`/api/clubs/${club.id}/venues`).set('Cookie', cot).send({
      name: 'X', city: 'Y',
    })
    expect(res.status).toBe(403)
  })
})
