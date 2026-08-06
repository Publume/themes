import { z } from 'astro/zod'
import rawConfig from '../data/site-config.generated.json'
import { messagesFor, type SiteLocale } from '../i18n/messages'

const optionalUrl = z.union([z.literal(''), z.url()])
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/)
const language = z.string().min(2).max(35)

const siteConfigSchema = z
  .object({
    url: optionalUrl,
    name: z.string(),
    description: z.string(),
    tagline: z.string(),
    locale: language,
    outputLanguages: z.array(language).min(1).max(20),
    defaultContentLanguage: language,
    publisherName: z.string(),
    authorName: z.string(),
    contactUrl: optionalUrl,
    aiDisclosure: z.string(),
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
    showTopics: z.boolean(),
    showScore: z.boolean(),
    showSources: z.boolean(),
    footerText: z.string(),
  })
  .superRefine((value, context) => {
    if (new Set(value.outputLanguages).size !== value.outputLanguages.length)
      context.addIssue({ code: 'custom', path: ['outputLanguages'], message: 'Output languages must be unique' })
    if (!value.outputLanguages.includes(value.defaultContentLanguage))
      context.addIssue({
        code: 'custom',
        path: ['defaultContentLanguage'],
        message: 'Default content language must be included in output languages',
      })
  })

const parsed = siteConfigSchema.parse(rawConfig)
const localized = messagesFor(parsed.locale)
const fallback = (value: string, defaultValue: string) => value.trim() || defaultValue

export const uiLocale: SiteLocale = localized.locale
export const ui = localized.messages
export const siteConfig = {
  ...parsed,
  locale: localized.locale,
  name: fallback(parsed.name, ui.defaultSiteName),
  description: fallback(parsed.description, ui.defaultDescription),
  tagline: fallback(parsed.tagline, ui.defaultTagline),
  publisherName: fallback(parsed.publisherName, fallback(parsed.name, ui.defaultSiteName)),
  authorName: fallback(parsed.authorName, fallback(parsed.name, ui.defaultSiteName)),
  aiDisclosure: fallback(parsed.aiDisclosure, ui.defaultAiDisclosure),
  footerText: fallback(parsed.footerText, ui.defaultFooter),
} as const

export function sitePath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${normalized}` || '/'
}

export function languageHomePath(languageTag: string): string {
  return languageTag === siteConfig.defaultContentLanguage ? sitePath('/') : sitePath(`/${languageTag}/`)
}

export function languageRssPath(languageTag: string): string {
  return languageTag === siteConfig.defaultContentLanguage ? sitePath('/rss.xml') : sitePath(`/${languageTag}/rss.xml`)
}

export function articleSlug(articleId: string): string {
  const separator = articleId.indexOf('/')
  return separator < 0 ? articleId : articleId.slice(separator + 1)
}

export function articlePath(articleId: string, languageTag: string): string {
  return sitePath(`/${languageTag}/${articleSlug(articleId)}/`)
}

export function formatDate(date: Date, languageTag: string): string {
  try {
    return new Intl.DateTimeFormat(languageTag, { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
  } catch {
    return new Intl.DateTimeFormat(uiLocale).format(date)
  }
}

export function languageName(languageTag: string): string {
  try {
    return new Intl.DisplayNames([uiLocale], { type: 'language' }).of(languageTag) ?? languageTag
  } catch {
    return languageTag
  }
}

export function textDirection(languageTag: string): 'ltr' | 'rtl' {
  return /^(ar|fa|he|ur)(-|$)/i.test(languageTag) ? 'rtl' : 'ltr'
}
