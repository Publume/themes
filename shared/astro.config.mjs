import { readFileSync } from 'node:fs'
import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'

const siteConfig = JSON.parse(readFileSync(new URL('./src/data/site-config.generated.json', import.meta.url), 'utf8'))
const site = siteConfig.url || undefined
const pathname = site ? new URL(site).pathname.replace(/\/$/, '') : ''
const excludedRoutes = [
  'search',
  '404',
  ...(siteConfig.showTopics ? [] : ['topics']),
  ...(siteConfig.showSources ? [] : ['sources']),
]
const excludedRoutePattern = new RegExp(`/(?:${excludedRoutes.join('|')})(?:/|\\.html?$)`)

export default defineConfig({
  site,
  base: pathname || undefined,
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  integrations: site ? [sitemap({ filter: (page) => !excludedRoutePattern.test(new URL(page).pathname) })] : [],
})
