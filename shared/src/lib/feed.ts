import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { articlesForLanguage } from './articles'
import { articlePath, siteConfig } from './site'

export async function languageFeed(language: string, site?: URL) {
  const articles = articlesForLanguage(await getCollection('articles'), language)
  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: site ?? (siteConfig.url || 'https://example.invalid/'),
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.summary,
      pubDate: article.data.publishedAt,
      link: articlePath(article.id, article.data.language),
    })),
  })
}
