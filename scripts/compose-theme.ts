import { cp, mkdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'

const markerSchema = z
  .object({ schemaVersion: z.literal(1), id: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/) })
  .strict()

const ignoredEntries = new Set(['.astro', '.git', 'dist', 'node_modules'])

async function copyTree(source: string, destination: string): Promise<void> {
  await cp(source, destination, {
    recursive: true,
    filter: (entry) => !ignoredEntries.has(path.basename(entry)) && path.basename(entry) !== '.publume-theme.json',
  })
}

export async function composeTheme(repository: string, themeId: string, destination: string): Promise<void> {
  const shared = path.join(repository, 'shared')
  const overlay = path.join(repository, 'themes', themeId)
  const marker = markerSchema.parse(JSON.parse(await readFile(path.join(overlay, '.publume-theme.json'), 'utf8')))
  if (marker.id !== themeId) throw new Error(`Theme directory ${themeId} does not match marker id ${marker.id}`)

  await rm(destination, { recursive: true, force: true })
  await mkdir(destination, { recursive: true })
  await copyTree(shared, destination)
  await copyTree(overlay, destination)
}
