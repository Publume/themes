import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    decisionKey: z.string().min(1),
    language: z.string().min(2),
    title: z.string().min(1),
    summary: z.string().min(1),
    publishedAt: z.coerce.date(),
    score: z.number().min(0).max(1).optional(),
    topics: z.array(z.string().min(1)).default([]),
    sourceUrls: z.array(z.url()).min(1),
  }),
})

export const collections = { articles }
