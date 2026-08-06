import type { CollectionEntry } from 'astro:content'

export type Article = CollectionEntry<'articles'>

export function articlesForLanguage(articles: readonly Article[], language: string): readonly Article[] {
  return articles
    .filter((article) => article.data.language === language)
    .sort((left, right) => right.data.publishedAt.getTime() - left.data.publishedAt.getTime())
}

export function alternativesForArticle(article: Article, articles: readonly Article[]): readonly Article[] {
  return articles.filter((candidate) => candidate.data.decisionKey === article.data.decisionKey)
}
