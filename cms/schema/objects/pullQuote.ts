import { defineField, defineType } from 'sanity';

/**
 * Pull quote with attribution — visually distinct from a plain blockquote,
 * and something an AI answer engine can lift as a quotable line.
 */
export const pullQuote = defineType({
	name: 'pullQuote',
	title: 'Pull quote',
	type: 'object',
	fields: [
		defineField({
			name: 'quote',
			title: 'Quote',
			type: 'text',
			rows: 3,
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'attribution',
			title: 'Attribution',
			type: 'string',
			description: 'Who said it, e.g. "Dr. Maya Bennett".',
		}),
	],
	preview: {
		select: { title: 'quote', subtitle: 'attribution' },
	},
});
