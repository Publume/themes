import { languageFeed } from '../lib/feed'
import { siteConfig } from '../lib/site'

export function getStaticPaths() {
  return siteConfig.url ? [{ params: { rss: 'rss' } }] : []
}

export function GET(context: { site?: URL }) {
  return languageFeed(siteConfig.defaultContentLanguage, context.site)
}
