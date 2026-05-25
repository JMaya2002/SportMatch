// server/tests/users.test.js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/index.js'
import { createTestUser } from './helpers.js'

async function loginAs(app, user) {
  const res = await request(app).post('/api/auth/login').send({
    email: user.email,
    password: user.plainPassword,
  })
  return res.headers['set-cookie']
}

describe('GET /api/users', () => {
  it('devuelve lista de usuarios', async () => {
    await createTestUser({ username: 'a', email: 'a@t.com' })
    await createTestUser({ username: 'b', email: 'b@t.com', city: 'Madrid' })
    const app = createApp()
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(200)
    expect(res.body.users).toHaveLength(2)
    expect(res.body.users[0]).not.toHaveProperty('password_hash')
    expect(res.body.users[0]).not.toHaveProperty('email')
  })

  it('filtra por ciudad', async () => {
    await createTestUser({ username: 'bcn', email: 'bcn@t.com', city: 'Barcelona' })
    await createTestUser({ username: 'mad', email: 'mad@t.com', city: 'Madrid' })
    const app = createApp()
    const res = await request(app).get('/api/users?city=Madrid')
    expect(res.body.users).toHaveLength(1)
    expect(res.body.users[0].username).toBe('mad')
  })

  it('filtra por deporte y nivel combinados', async () => {
    await createTestUser({ username: 'p1', email: 'p1@t.com', main_sport: 'padel', level: 'intermedio' })
    await createTestUser({ username: 'p2', email: 'p2@t.com', main_sport: 'padel', level: 'avanzado' })
    await createTestUser({ username: 't1', email: 't1@t.com', main_sport: 'tenis', level: 'intermedio' })
    const app = createApp()
    const res = await request(app).get('/api/users?sport=padel&level=intermedio')
    expect(res.body.users).toHaveLength(1)
    expect(res.body.users[0].username).toBe('p1')
  })
})

describe('GET /api/users/:username', () => {
  it('devuelve perfil público (sin email ni hash)', async () => {
    await createTestUser({ username: 'publicuser', email: 'pub@t.com' })
    const app = createApp()
    const res = await request(app).get('/api/users/publicuser')
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('publicuser')
    expect(res.body.user.password_hash).toBeUndefined()
    expect(res.body.user.email).toBeUndefined()
  })

  it('404 si no existe', async () => {
    const app = createApp()
    const res = await request(app).get('/api/users/inexistente')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/users/me', () => {
  it('actualiza datos editables', async () => {
    const user = await createTestUser({ username: 'edit', email: 'edit@t.com' })
    const app = createApp()
    const cookie = await loginAs(app, user)
    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', cookie)
      .send({ city: 'Valencia', level: 'avanzado' })
    expect(res.status).toBe(200)
    expect(res.body.user.city).toBe('Valencia')
    expect(res.body.user.level).toBe('avanzado')
  })

  it('sin auth devuelve 401', async () => {
    const app = createApp()
    const res = await request(app).patch('/api/users/me').send({ city: 'X' })
    expect(res.status).toBe(401)
  })
})
