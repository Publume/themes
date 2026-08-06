import path from 'node:path'
import { composeTheme } from './compose-theme'

const themeId = Bun.argv[2]
if (!themeId || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(themeId)) throw new Error('Usage: bun run dev:theme <theme-id>')

const repository = path.resolve(import.meta.dir, '..')
const destination = path.join(repository, '.local', themeId)
await composeTheme(repository, themeId, destination)

for (const args of [
  ['bun', 'install', '--frozen-lockfile', '--cwd', destination],
  ['bun', 'run', '--cwd', destination, 'dev'],
]) {
  const process = Bun.spawn(args, { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' })
  const exitCode = await process.exited
  if (exitCode !== 0) throw new Error(`Theme preview failed with exit code ${exitCode}`)
}
