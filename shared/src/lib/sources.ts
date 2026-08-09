import type { Article } from './articles'
import { articlesForLanguage } from './articles'

export type SourceGroup = {
  readonly hostname: string
  readonly href: string
  readonly articleCount: number
}

export function sourcesForLanguage(articles: readonly Article[], language: string): readonly SourceGroup[] {
  const sources = new Map<string, { href: string; articleIds: Set<string> }>()
  for (const article of articlesForLanguage(articles, language)) {
    for (const sourceUrl of article.data.sourceUrls) {
      const source = new URL(sourceUrl)
      const existing = sources.get(source.hostname)
      if (existing) existing.articleIds.add(article.id)
      else sources.set(source.hostname, { href: source.origin, articleIds: new Set([article.id]) })
    }
  }
  return [...sources.entries()]
    .map(([hostname, source]) => ({ hostname, href: source.href, articleCount: source.articleIds.size }))
    .sort((left, right) => left.hostname.localeCompare(right.hostname, language))
}
