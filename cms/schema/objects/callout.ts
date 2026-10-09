import { defineField, defineType } from 'sanity';

/** Highlighted aside for tips, warnings and vet-advice callouts. */
export const callout = defineType({
	name: 'callout',
	title: 'Callout',
	type: 'object',
	fields: [
		defineField({
			name: 'tone',
			title: 'Tone',
			type: 'string',
			options: {
				list: [
					{ title: 'Information', value: 'info' },
					{ title: 'Tip', value: 'tip' },
					{ title: 'Warning', value: 'warning' },
					{ title: 'When to see a vet', value: 'vet' },
				],
				layout: 'radio',
			},
			initialValue: 'info',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			description: 'Optional short heading, e.g. "When to call your vet".',
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'text',
			rows: 3,
			validation: (Rule) => Rule.required(),
		}),
	],
	preview: {
		select: { title: 'title', tone: 'tone', body: 'body' },
		prepare: ({ title, tone, body }) => ({ title: title || 'Callout', subtitle: `${tone}: ${body ?? ''}`.slice(0, 90) }),
	},
});
