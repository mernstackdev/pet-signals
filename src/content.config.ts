import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { CLUSTER_SLUGS } from './lib/clusters';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	schema: ({ image }) =>
		z.object({
			title: z.string().min(10).max(120),
			description: z.string().min(50).max(200),
			cluster: z.enum(CLUSTER_SLUGS),
			publishDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			author: reference('authors'),
			heroImage: image().optional(),
			heroImageAlt: z.string().optional(),
			tags: z.array(z.string()).default([]),
			featured: z.boolean().default(false),
			draft: z.boolean().default(false),
			seo: z
				.object({
					title: z.string().optional(),
					description: z.string().optional(),
					canonical: z.string().url().optional(),
				})
				.optional(),
			faq: z
				.array(z.object({ question: z.string(), answer: z.string() }))
				.default([]),
			howTo: z
				.object({
					name: z.string().optional(),
					totalTime: z.string().optional(),
					steps: z.array(z.object({ name: z.string(), text: z.string() })).min(1),
				})
				.optional(),
		}),
});

const authors = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
	schema: () =>
		z.object({
			name: z.string(),
			bio: z.string(),
			jobTitle: z.string(),
			knowsAbout: z.array(z.string()).default([]),
			sameAs: z.array(z.string().url()).default([]),
		}),
});

export const collections = { blog, authors };
