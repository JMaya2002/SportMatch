// server/tests/auth.test.js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/index.js'
import { createTestUser } from './helpers.js'

const validRegister = {
  username: 'nuevo',
  email: 'nuevo@test.com',
  password: 'test1234',
  name: 'Nuevo Usuario',
  age: 25,
  city: 'Barcelona',
  mainSport: 'padel',
  level: 'intermedio',
  ageConfirmed: true,
}

describe('POST /api/auth/register', () => {
  it('registra un usuario válido y devuelve cookie + user', async () => {
    const app = createApp()
    const res = await request(app).post('/api/auth/register').send(validRegister)
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({
      username: 'nuevo',
      email: 'nuevo@test.com',
      name: 'Nuevo Usuario',
    })
    expect(res.body.user.password_hash).toBeUndefined()
    expect(res.headers['set-cookie']).toBeDefined()
    expect(res.headers['set-cookie'][0]).toMatch(/token=/)
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i)
  })

  it('rechaza si edad < 18', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, age: 17, username: 'menor', email: 'menor@t.com' })
    expect(res.status).toBe(400)
  })

  it('rechaza si ageConfirmed=false', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, ageConfirmed: false, username: 'sin', email: 'sin@t.com' })
    expect(res.status).toBe(400)
  })

  it('rechaza username duplicado con 409', async () => {
    const app = createApp()
    await request(app).post('/api/auth/register').send(validRegister)
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, email: 'otro@t.com' })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/auth/login', () => {
  it('login válido devuelve cookie + user', async () => {
    const user = await createTestUser({ email: 'login@t.com', username: 'loguser' })
    const app = createApp()
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@t.com',
      password: user.plainPassword,
    })
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('loguser')
    expect(res.headers['set-cookie'][0]).toMatch(/token=/)
  })

  it('contraseña incorrecta devuelve 401', async () => {
    await createTestUser({ email: 'login2@t.com', username: 'loguser2' })
    const app = createApp()
    const res = await request(app).post('/api/auth/login').send({
      email: 'login2@t.com',
      password: 'wrong-password',
    })
    expect(res.status).toBe(401)
  })

  it('usuario inexistente devuelve 401', async () => {
    const app = createApp()
    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@t.com',
      password: 'whatever',
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('sin cookie devuelve 401', async () => {
    const app = createApp()
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('con cookie válida devuelve el usuario', async () => {
    const user = await createTestUser({ email: 'me@t.com', username: 'meuser' })
    const app = createApp()
    const login = await request(app).post('/api/auth/login').send({
      email: 'me@t.com',
      password: user.plainPassword,
    })
    const cookie = login.headers['set-cookie']
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('meuser')
  })
})

describe('POST /api/auth/logout', () => {
  it('limpia la cookie', async () => {
    const user = await createTestUser({ email: 'lo@t.com', username: 'lo' })
    const app = createApp()
    const login = await request(app).post('/api/auth/login').send({
      email: 'lo@t.com',
      password: user.plainPassword,
    })
    const cookie = login.headers['set-cookie']
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie)
    expect(res.status).toBe(204)
    expect(res.headers['set-cookie'][0]).toMatch(/token=;/)
  })
})

describe('GET /api/auth/google', () => {
  it('redirige a accounts.google.com', async () => {
    const app = createApp()
    const res = await request(app).get('/api/auth/google')
    expect([301, 302]).toContain(res.status)
    expect(res.headers.location).toMatch(/accounts\.google\.com/)
  })
})
