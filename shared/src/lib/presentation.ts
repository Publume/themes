export const presentationSchemaVersion = 1 as const
export const adPlacementIds = ['homeAfterFeed', 'archiveInline', 'articleEnd'] as const

export type AdPlacementId = (typeof adPlacementIds)[number]
export type Presentation = {
  readonly schemaVersion: typeof presentationSchemaVersion
  readonly ads:
    | { readonly provider: 'none' }
    | {
        readonly provider: 'adsense'
        readonly publisherId: `ca-pub-${string}`
        readonly slots: Readonly<Partial<Record<AdPlacementId, string>>>
      }
}

const publisherIdPattern = /^ca-pub-\d{16}$/
const slotIdPattern = /^\d{1,20}$/

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new TypeError(`${label} must be an object`)
  return value as Record<string, unknown>
}

function assertKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const unexpected = Object.keys(value).find((key) => !allowed.includes(key))
  if (unexpected) throw new TypeError(`${label} contains unknown field ${unexpected}`)
}

export function parsePresentation(value: unknown): Presentation {
  if (value === undefined) return { schemaVersion: presentationSchemaVersion, ads: { provider: 'none' } }

  const presentation = record(value, 'presentation')
  if (Object.keys(presentation).length === 0)
    return { schemaVersion: presentationSchemaVersion, ads: { provider: 'none' } }
  assertKeys(presentation, ['schemaVersion', 'ads'], 'presentation')
  if (presentation.schemaVersion !== presentationSchemaVersion)
    throw new TypeError(`presentation.schemaVersion must be ${presentationSchemaVersion}`)

  const ads = record(presentation.ads, 'presentation.ads')
  if (ads.provider === 'none') {
    assertKeys(ads, ['provider'], 'presentation.ads')
    return { schemaVersion: presentationSchemaVersion, ads: { provider: 'none' } }
  }
  if (ads.provider !== 'adsense') throw new TypeError('presentation.ads.provider must be none or adsense')

  assertKeys(ads, ['provider', 'publisherId', 'slots'], 'presentation.ads')
  if (typeof ads.publisherId !== 'string' || !publisherIdPattern.test(ads.publisherId))
    throw new TypeError('presentation.ads.publisherId must match ca-pub- followed by 16 digits')

  const rawSlots = record(ads.slots, 'presentation.ads.slots')
  assertKeys(rawSlots, adPlacementIds, 'presentation.ads.slots')
  const slots: Partial<Record<AdPlacementId, string>> = {}
  for (const placement of adPlacementIds) {
    const slot = rawSlots[placement]
    if (slot === undefined) continue
    if (typeof slot !== 'string' || !slotIdPattern.test(slot))
      throw new TypeError(`presentation.ads.slots.${placement} must contain 1 to 20 digits`)
    slots[placement] = slot
  }
  if (Object.keys(slots).length === 0) throw new TypeError('presentation.ads.slots must enable at least one placement')

  return {
    schemaVersion: presentationSchemaVersion,
    ads: { provider: 'adsense', publisherId: ads.publisherId as `ca-pub-${string}`, slots },
  }
}
