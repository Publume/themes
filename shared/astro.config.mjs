import { readFileSync } from 'node:fs'
import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'

const siteConfig = JSON.parse(readFileSync(new URL('./src/data/site-config.generated.json', import.meta.url), 'utf8'))
const site = siteConfig.url || undefined
const pathname = site ? new URL(site).pathname.replace(/\/$/, '') : ''

export default defineConfig({
  site,
  base: pathname || undefined,
  trailingSlash: 'always',
  integrations: site ? [sitemap()] : [],
})
