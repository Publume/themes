import { languageFeed } from '../lib/feed'
import { siteConfig } from '../lib/site'

export function GET(context: { site?: URL }) {
  return languageFeed(siteConfig.defaultContentLanguage, context.site)
}
