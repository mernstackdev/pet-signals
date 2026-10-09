import { defineField, defineType } from 'sanity';

/**
 * Singleton document with the site-wide values used to build Organization and
 * WebSite structured data, plus default social/SEO fallbacks.
 * Edited at a fixed document id ("siteSettings") — see cms/structure/index.ts.
 */
export const siteSettings = defineType({
	name: 'siteSettings',
	title: 'Site settings',
	type: 'document',
	groups: [
		{ name: 'general', title: 'General', default: true },
		{ name: 'organization', title: 'Organization (structured data)' },
		{ name: 'defaults', title: 'SEO defaults' },
	],
	fields: [
		defineField({
			name: 'siteName',
			title: 'Site name',
			type: 'string',
			group: 'general',
			initialValue: 'Pet Signals',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'siteUrl',
			title: 'Site URL',
			type: 'url',
			group: 'general',
			description: 'Canonical origin used to build absolute URLs in structured data.',
			validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
		}),
		defineField({
			name: 'tagline',
			title: 'Tagline',
			type: 'string',
			group: 'general',
			initialValue: 'Read your pet like a pro.',
		}),

		defineField({
			name: 'organizationName',
			title: 'Publisher name',
			type: 'string',
			group: 'organization',
			description: 'Publisher used in Article and Organization structured data.',
			initialValue: 'Pet Signals',
		}),
		defineField({
			name: 'organizationLogo',
			title: 'Publisher logo',
			type: 'imageWithAlt',
			group: 'organization',
			description: 'Square, at least 112×112px. Used for the publisher logo in structured data.',
		}),
		defineField({
			name: 'sameAs',
			title: 'Social profiles',
			type: 'array',
			of: [{ type: 'url' }],
			group: 'organization',
			description: 'Facebook, Instagram, YouTube, X… Feeds Organization schema "sameAs".',
		}),
		defineField({
			name: 'contactEmail',
			title: 'Contact email',
			type: 'string',
			group: 'organization',
			validation: (Rule) => Rule.email(),
		}),
		defineField({
			name: 'twitterHandle',
			title: 'Twitter / X handle',
			type: 'string',
			group: 'organization',
			placeholder: '@petsignals',
		}),

		defineField({
			name: 'defaults',
			title: 'Default SEO & social',
			type: 'object',
			group: 'defaults',
			options: { collapsible: true, collapsed: false },
			description: 'Used for pages that do not set their own values.',
			fields: [
				defineField({ name: 'metaTitle', title: 'Default meta title', type: 'string' }),
				defineField({ name: 'metaDescription', title: 'Default meta description', type: 'text', rows: 3 }),
				defineField({
					name: 'ogImage',
					title: 'Default OG image',
					type: 'image',
					options: { hotspot: true },
					description: '1200×630px fallback for social sharing.',
					fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
				}),
			],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Site settings' }),
	},
});
