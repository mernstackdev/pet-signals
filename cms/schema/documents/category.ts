import { defineField, defineType } from 'sanity';

/**
 * A category is a top-level topic hub ("cluster"). The slug must match one of the
 * frontend's cluster slugs so hubs and article URLs line up.
 */
export const category = defineType({
	name: 'category',
	title: 'Category',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			description: 'Short label used in navigation, e.g. "Pet Behavior".',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'string',
			options: {
				list: [
					{ title: 'pet-behavior', value: 'pet-behavior' },
					{ title: 'pet-habits', value: 'pet-habits' },
					{ title: 'how-to-guides', value: 'how-to-guides' },
				],
				layout: 'radio',
			},
			description: 'Must match a cluster slug in the frontend — it forms the URL /<slug>/<post>/ and the hub path /<slug>/.',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'heading',
			title: 'Page heading (H1)',
			type: 'string',
			description: 'Descriptive heading shown at the top of the hub page.',
		}),
		defineField({
			name: 'intro',
			title: 'Intro paragraph',
			type: 'text',
			rows: 3,
			description: 'Shown under the heading on the hub page. Also useful context for AI answer engines.',
		}),
		defineField({
			name: 'accent',
			title: 'Accent colour',
			type: 'string',
			options: {
				list: [
					{ title: 'Amber', value: 'amber' },
					{ title: 'Teal', value: 'teal' },
					{ title: 'Violet', value: 'violet' },
				],
				layout: 'radio',
			},
			initialValue: 'amber',
		}),
		defineField({
			name: 'seo',
			title: 'SEO & social',
			type: 'seo',
			description: 'Overrides for the hub page. Falls back to the name and intro.',
		}),
	],
	preview: {
		select: { title: 'name', subtitle: 'slug' },
	},
});
