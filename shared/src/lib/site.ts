import { z } from 'astro/zod'
import rawConfig from '../data/site-config.generated.json'
import { messagesFor, type SiteLocale } from '../i18n/messages'
import { parsePresentation } from './presentation'
import { contactUrlSchema, httpUrlSchema } from './url'

const optionalHttpUrl = z.union([z.literal(''), httpUrlSchema])
const optionalContactUrl = z.union([z.literal(''), contactUrlSchema])
const language = z.string().min(2).max(35)

const siteConfigSchema = z
  .object({
    url: optionalHttpUrl,
    name: z.string(),
    description: z.string(),
    tagline: z.string(),
    locale: language,
    outputLanguages: z.array(language).min(1).max(20),
    defaultContentLanguage: language,
    publisherName: z.string(),
    authorName: z.string(),
    contactUrl: optionalContactUrl,
    aiDisclosure: z.string(),
    socialImageUrl: optionalHttpUrl,
    newsletterUrl: optionalHttpUrl,
    sponsorUrl: optionalHttpUrl,
    showTopics: z.boolean(),
    showScore: z.boolean(),
    showSources: z.boolean(),
    footerText: z.string(),
    presentation: z.unknown().optional(),
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
  presentation: parsePresentation(parsed.presentation),
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

function languageSectionPath(languageTag: string, section: string): string {
  const prefix = languageTag === siteConfig.defaultContentLanguage ? '' : `/${languageTag}`
  return sitePath(`${prefix}/${section}/`)
}

export function languageArchivePath(languageTag: string, page = 1): string {
  const archive = languageSectionPath(languageTag, 'archive')
  return page === 1 ? archive : `${archive}page/${page}/`
}

export function languageTopicsPath(languageTag: string, topicId?: string): string {
  const topics = languageSectionPath(languageTag, 'topics')
  return topicId ? `${topics}${topicId}/` : topics
}

export function languageSearchPath(languageTag: string): string {
  return languageSectionPath(languageTag, 'search')
}

export function languageSourcesPath(languageTag: string): string {
  return languageSectionPath(languageTag, 'sources')
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

export function formatArticleCount(count: number, languageTag: string): string {
  const template = count === 1 && ui.articleCountOne ? ui.articleCountOne : ui.articleCount
  return template.replace('{count}', new Intl.NumberFormat(languageTag).format(count))
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
