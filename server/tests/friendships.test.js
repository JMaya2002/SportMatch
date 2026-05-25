// server/tests/friendships.test.js
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

describe('Amistades', () => {
  it('flujo: solicitar → aceptar → ver amigos', async () => {
    const a = await createTestUser({ username: 'fa', email: 'fa@t.com' })
    const b = await createTestUser({ username: 'fb', email: 'fb@t.com' })
    const app = createApp()
    const ca = await loginAs(app, a)
    const cb = await loginAs(app, b)

    // a solicita amistad a b
    const req1 = await request(app).post(`/api/users/${b.id}/friend-request`).set('Cookie', ca)
    expect(req1.status).toBe(201)
    expect(req1.body.status).toBe('sent')

    // estado desde a → 'sent'
    const st1 = await request(app).get(`/api/users/${b.id}/friendship`).set('Cookie', ca)
    expect(st1.body.status).toBe('sent')

    // estado desde b → 'received'
    const st2 = await request(app).get(`/api/users/${a.id}/friendship`).set('Cookie', cb)
    expect(st2.body.status).toBe('received')

    // b acepta
    const acc = await request(app).post(`/api/users/${a.id}/friend-accept`).set('Cookie', cb)
    expect(acc.status).toBe(200)
    expect(acc.body.status).toBe('friends')

    // ambos ven amistad
    const me_a = await request(app).get('/api/users/me/friends').set('Cookie', ca)
    expect(me_a.body.friends.find(f => f.id === b.id)).toBeTruthy()
    const me_b = await request(app).get('/api/users/me/friends').set('Cookie', cb)
    expect(me_b.body.friends.find(f => f.id === a.id)).toBeTruthy()
  })

  it('rechazar (DELETE) borra solicitud', async () => {
    const a = await createTestUser({ username: 'ra', email: 'ra@t.com' })
    const b = await createTestUser({ username: 'rb', email: 'rb@t.com' })
    const app = createApp()
    const ca = await loginAs(app, a)
    const cb = await loginAs(app, b)
    await request(app).post(`/api/users/${b.id}/friend-request`).set('Cookie', ca)
    const del = await request(app).delete(`/api/users/${a.id}/friend`).set('Cookie', cb)
    expect(del.status).toBe(204)
    const st = await request(app).get(`/api/users/${b.id}/friendship`).set('Cookie', ca)
    expect(st.body.status).toBe('none')
  })

  it('eliminar amistad funciona', async () => {
    const a = await createTestUser({ username: 'da', email: 'da@t.com' })
    const b = await createTestUser({ username: 'db', email: 'db@t.com' })
    const app = createApp()
    const ca = await loginAs(app, a)
    const cb = await loginAs(app, b)
    await request(app).post(`/api/users/${b.id}/friend-request`).set('Cookie', ca)
    await request(app).post(`/api/users/${a.id}/friend-accept`).set('Cookie', cb)
    await request(app).delete(`/api/users/${b.id}/friend`).set('Cookie', ca)
    const st = await request(app).get(`/api/users/${b.id}/friendship`).set('Cookie', ca)
    expect(st.body.status).toBe('none')
  })

  it('sin auth devuelve 401', async () => {
    const app = createApp()
    const res = await request(app).post('/api/users/1/friend-request')
    expect(res.status).toBe(401)
  })
})
