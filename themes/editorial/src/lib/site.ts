import { z } from 'astro/zod'
import rawConfig from '../data/site-config.generated.json'

const optionalUrl = z.union([z.literal(''), z.url()])
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/)

const siteConfigSchema = z.object({
  url: optionalUrl,
  name: z.string().min(1),
  description: z.string().min(1),
  tagline: z.string().min(1),
  locale: z.string().min(2),
  publisherName: z.string().min(1),
  authorName: z.string().min(1),
  contactUrl: optionalUrl,
  aiDisclosure: z.string().min(1),
  socialImageUrl: optionalUrl,
  newsletterUrl: optionalUrl,
  sponsorUrl: optionalUrl,
  theme: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
  primaryColor: color,
  accentColor: color,
  backgroundColor: color,
  surfaceColor: color,
  textColor: color,
  mutedColor: color,
  maxWidth: z.string().regex(/^\d{3,4}px$/),
  cardRadius: z.string().regex(/^\d{1,3}px$/),
  articleTitleMaxSize: z.string().regex(/^\d{1,2}(?:\.\d+)?(?:rem|px)$/),
  showTopics: z.boolean(),
  showScore: z.boolean(),
  showSources: z.boolean(),
  footerText: z.string().min(1),
})

export const siteConfig = siteConfigSchema.parse(rawConfig)

export function sitePath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${normalized}` || '/'
}

export function formatDate(date: Date, language: string): string {
  try {
    return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en').format(date)
  }
}

export function textDirection(language: string): 'ltr' | 'rtl' {
  return /^(ar|fa|he|ur)(-|$)/i.test(language) ? 'rtl' : 'ltr'
}
