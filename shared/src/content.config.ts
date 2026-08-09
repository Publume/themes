import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { topicIdForLabel } from './lib/topics'
import { httpUrlSchema } from './lib/url'

const topicId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/)

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z
    .object({
      decisionKey: z.string().min(1),
      language: z.string().min(2),
      title: z.string().min(1),
      summary: z.string().min(1),
      publishedAt: z.coerce.date(),
      score: z.number().min(0).max(1).optional(),
      topics: z.array(z.string().min(1)).default([]),
      topicIds: z.array(topicId).optional(),
      sourceUrls: z.array(httpUrlSchema).min(1),
    })
    .transform((article, context) => {
      if (article.topicIds && article.topicIds.length !== article.topics.length) {
        context.addIssue({ code: 'custom', path: ['topicIds'], message: 'Topic IDs must match topics by position' })
        return z.NEVER
      }
      return { ...article, topicIds: article.topicIds ?? article.topics.map(topicIdForLabel) }
    }),
})

export const collections = { articles }
