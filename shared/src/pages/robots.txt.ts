import { siteConfig } from '../lib/site'

export function GET(context: { site?: URL }) {
  const site = context.site ?? (siteConfig.url ? new URL(siteConfig.url) : undefined)
  const lines = ['User-agent: *', 'Allow: /']
  if (site) lines.push(`Sitemap: ${new URL('sitemap-index.xml', site).href}`)
  return new Response(`${lines.join('\n')}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
