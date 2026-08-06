import { languageFeed } from '../../lib/feed'
import { siteConfig } from '../../lib/site'

export function getStaticPaths() {
  return siteConfig.outputLanguages
    .filter((language) => language !== siteConfig.defaultContentLanguage)
    .map((language) => ({ params: { language }, props: { contentLanguage: language } }))
}

export function GET(context: { props: { contentLanguage: string }; site?: URL }) {
  return languageFeed(context.props.contentLanguage, context.site)
}
