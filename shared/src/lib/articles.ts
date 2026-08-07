import type { CollectionEntry } from 'astro:content'
import { type TopicReference, topicIdForLabel } from './topics'

export type Article = CollectionEntry<'articles'>
export type TopicGroup = { readonly topic: TopicReference; readonly articles: readonly Article[] }
export const archivePageSize = 20
export const homeArticleLimit = 12

export function articlesForLanguage(articles: readonly Article[], language: string): readonly Article[] {
  return articles
    .filter((article) => article.data.language === language)
    .sort((left, right) => right.data.publishedAt.getTime() - left.data.publishedAt.getTime())
}

export function alternativesForArticle(article: Article, articles: readonly Article[]): readonly Article[] {
  return articles.filter((candidate) => candidate.data.decisionKey === article.data.decisionKey)
}

export function topicsForArticle(article: Article): readonly TopicReference[] {
  return article.data.topics.map((label, index) => ({
    id: article.data.topicIds[index] ?? topicIdForLabel(label),
    label,
  }))
}

export function topicsForLanguage(articles: readonly Article[], language: string): readonly TopicGroup[] {
  const topics = new Map<string, { topic: TopicReference; articles: Article[] }>()
  for (const article of articlesForLanguage(articles, language)) {
    for (const topic of topicsForArticle(article)) {
      const existing = topics.get(topic.id)
      if (existing) existing.articles.push(article)
      else topics.set(topic.id, { topic, articles: [article] })
    }
  }
  return [...topics.values()].sort(
    (left, right) =>
      right.articles.length - left.articles.length || left.topic.label.localeCompare(right.topic.label, language),
  )
}
