import { z } from 'zod'

export const httpUrlSchema = z.url().regex(/^https?:\/\//i, 'URL must use HTTP or HTTPS')
export const contactUrlSchema = z
  .url()
  .regex(/^(?:https?:\/\/|mailto:)/i, 'Contact URL must use HTTP, HTTPS, or mailto')
