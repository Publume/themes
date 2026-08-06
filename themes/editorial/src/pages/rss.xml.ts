import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { siteConfig, sitePath } from '../lib/site'

export async function GET(context: { site?: URL }) {
  const articles = (await getCollection('articles')).sort(
    (left, right) => right.data.publishedAt.getTime() - left.data.publishedAt.getTime(),
  )
  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: (context.site ?? siteConfig.url) || 'https://example.invalid/',
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.summary,
      pubDate: article.data.publishedAt,
      link: sitePath(`/${article.id}/`),
    })),
  })
}
