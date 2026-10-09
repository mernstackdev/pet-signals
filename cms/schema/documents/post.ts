import { defineArrayMember, defineField, defineType } from 'sanity';

/** An article. One document per published guide. */
export const post = defineType({
	name: 'post',
	title: 'Post',
	type: 'document',
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'media', title: 'Media' },
		{ name: 'structured', title: 'Structured data' },
		{ name: 'seo', title: 'SEO' },
	],
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			group: 'content',
			description: 'The visible <h1>. Keep it clear and under ~120 characters.',
			validation: (Rule) => Rule.required().max(120),
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			group: 'content',
			options: { source: 'title', maxLength: 96 },
			description: 'URL segment. Changing it on a published post needs a redirect.',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'excerpt',
			title: 'Excerpt',
			type: 'text',
			rows: 3,
			group: 'content',
			description:
				'Short summary used on cards, in the RSS feed, and as the meta description fallback. 50–200 characters.',
			validation: (Rule) => Rule.required().min(50).max(200),
		}),
		defineField({
			name: 'category',
			title: 'Category',
			type: 'reference',
			to: [{ type: 'category' }],
			group: 'content',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'author',
			title: 'Author',
			type: 'reference',
			to: [{ type: 'author' }],
			group: 'content',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'publishedAt',
			title: 'Published at',
			type: 'datetime',
			group: 'content',
			initialValue: () => new Date().toISOString(),
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'updatedAt',
			title: 'Last updated',
			type: 'datetime',
			group: 'content',
			description:
				'Set only for a substantive update (not a typo fix). Shown to readers and emitted as dateModified.',
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'blockContent',
			group: 'content',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'tags',
			title: 'Tags',
			type: 'array',
			of: [{ type: 'string' }],
			group: 'content',
			options: { layout: 'tags' },
		}),
		defineField({
			name: 'featured',
			title: 'Feature on the homepage',
			type: 'boolean',
			group: 'content',
			initialValue: false,
		}),

		defineField({
			name: 'heroImage',
			title: 'Hero image',
			type: 'imageWithAlt',
			group: 'media',
			description: 'Also used for Open Graph/social previews and Article schema. 1200×630px or larger.',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'faq',
			title: 'FAQ',
			type: 'array',
			of: [defineArrayMember({ type: 'faqItem' })],
			group: 'structured',
			description:
				'Rendered at the end of the article and emitted as FAQPage structured data. 3–5 self-contained answers.',
		}),
		defineField({
			name: 'howTo',
			title: 'How-to steps',
			type: 'howTo',
			group: 'structured',
			description: 'For tutorial posts. Renders a numbered steps section and adds HowTo structured data.',
		}),
		defineField({
			name: 'relatedPosts',
			title: 'Related posts',
			type: 'array',
			of: [defineArrayMember({ type: 'reference', to: [{ type: 'post' }] })],
			group: 'structured',
			description: 'Manual internal links. Leave empty to let the site fall back to same-category posts.',
			validation: (Rule) => Rule.max(3),
		}),

		defineField({
			name: 'seo',
			title: 'SEO & social',
			type: 'seo',
			group: 'seo',
		}),
	],
	orderings: [
		{
			title: 'Newest first',
			name: 'publishedDesc',
			by: [{ field: 'publishedAt', direction: 'desc' }],
		},
		{
			title: 'Oldest first',
			name: 'publishedAsc',
			by: [{ field: 'publishedAt', direction: 'asc' }],
		},
	],
	preview: {
		select: { title: 'title', media: 'heroImage', publishedAt: 'publishedAt', featured: 'featured' },
		prepare: ({ title, media, publishedAt, featured }) => ({
			title: `${featured ? '★ ' : ''}${title || 'Untitled'}`,
			subtitle: publishedAt ? new Date(publishedAt).toDateString() : 'No publish date',
			media,
		}),
	},
});
