import { defineField, defineType } from 'sanity';

/**
 * Per-page SEO overrides. Every field here is optional — the frontend falls back
 * to the document's own title / excerpt / hero image, so a well-written post is
 * already a well-optimised page.
 */
export const seo = defineType({
	name: 'seo',
	title: 'SEO & social',
	type: 'object',
	options: { collapsible: true, collapsed: false },
	groups: [
		{ name: 'search', title: 'Search', default: true },
		{ name: 'social', title: 'Social' },
		{ name: 'advanced', title: 'Advanced' },
	],
	fields: [
		defineField({
			name: 'metaTitle',
			title: 'Meta title',
			type: 'string',
			group: 'search',
			description:
				'Overrides the article title in search results. Aim for 50–60 characters with the primary keyword near the front.',
			validation: (Rule) => Rule.max(60).warning('Titles longer than ~60 characters are truncated in Google.'),
		}),
		defineField({
			name: 'metaDescription',
			title: 'Meta description',
			type: 'text',
			rows: 3,
			group: 'search',
			description:
				'The snippet under the search result. 140–155 characters, unique per page, ending on a concrete benefit.',
			validation: (Rule) =>
				Rule.max(155).warning('Descriptions longer than ~155 characters are truncated in Google.'),
		}),
		defineField({
			name: 'focusKeyword',
			title: 'Focus keyword',
			type: 'string',
			group: 'search',
			description: 'Editorial reminder of the main query this article targets. Not published.',
		}),
		defineField({
			name: 'keywords',
			title: 'Keywords',
			type: 'array',
			of: [{ type: 'string' }],
			group: 'search',
			options: { layout: 'tags' },
			description: 'Secondary topics. Feeds the Article schema "keywords" property and aids internal linking.',
		}),
		defineField({
			name: 'openGraph',
			title: 'Open Graph (Facebook, LinkedIn, Slack…)',
			type: 'object',
			group: 'social',
			options: { collapsible: true, collapsed: true },
			fields: [
				defineField({
					name: 'title',
					title: 'OG title',
					type: 'string',
					description: 'Defaults to the article title. Can be more curiosity-driven than the meta title.',
				}),
				defineField({
					name: 'description',
					title: 'OG description',
					type: 'text',
					rows: 3,
					description: 'Defaults to the meta description, then the excerpt.',
				}),
				defineField({
					name: 'image',
					title: 'OG image',
					type: 'image',
					options: { hotspot: true },
					description: '1200×630px. Falls back to the hero image, then the site default. Keep under 1MB.',
					fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
				}),
			],
		}),
		defineField({
			name: 'twitter',
			title: 'Twitter / X card',
			type: 'object',
			group: 'social',
			options: { collapsible: true, collapsed: true },
			fields: [
				defineField({
					name: 'card',
					title: 'Card type',
					type: 'string',
					options: {
						list: [
							{ title: 'Summary with large image', value: 'summary_large_image' },
							{ title: 'Summary', value: 'summary' },
						],
						layout: 'radio',
					},
					initialValue: 'summary_large_image',
				}),
				defineField({ name: 'title', title: 'Twitter title', type: 'string' }),
				defineField({ name: 'description', title: 'Twitter description', type: 'text', rows: 2 }),
				defineField({
					name: 'image',
					title: 'Twitter image',
					type: 'image',
					options: { hotspot: true },
					fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
				}),
			],
		}),
		defineField({
			name: 'canonicalUrl',
			title: 'Canonical URL',
			type: 'url',
			group: 'advanced',
			description:
				'Only set this when the article is a duplicate of, or was first published on, another domain. Leave blank to use the article URL.',
			validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
		}),
		defineField({
			name: 'noindex',
			title: 'Hide from search engines (noindex)',
			type: 'boolean',
			group: 'advanced',
			initialValue: false,
			description:
				'Adds robots noindex,nofollow. Use for legal or thin pages — never for articles you want indexed.',
		}),
	],
});
