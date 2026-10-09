import { defineField, defineType } from 'sanity';

/** Internal link annotation — points at another post or a category hub. */
export const internalLink = defineType({
	name: 'internalLink',
	title: 'Internal link',
	type: 'object',
	fields: [
		defineField({
			name: 'reference',
			title: 'Link to',
			type: 'reference',
			to: [{ type: 'post' }, { type: 'category' }],
			validation: (Rule) => Rule.required(),
		}),
	],
});
