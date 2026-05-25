import Stripe from 'stripe'
import { config } from './config.js'

// Si no hay clave, exportamos null y los endpoints lo manejan (modo "fake checkout")
export const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey)
  : null
