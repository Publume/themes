import { siteConfig } from '../lib/site'

export function getStaticPaths() {
  const ads = siteConfig.presentation.ads
  return ads.provider === 'adsense' ? [{ params: { ads: 'ads' }, props: { publisherId: ads.publisherId } }] : []
}

export function GET(context: { props: { publisherId: string } }) {
  const publisherAccount = context.props.publisherId.replace(/^ca-/, '')
  return new Response(`google.com, ${publisherAccount}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
