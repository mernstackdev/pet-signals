import { defineArrayMember, defineField, defineType } from 'sanity';

/** One numbered step in a how-to guide. */
export const howToStep = defineType({
	name: 'howToStep',
	title: 'Step',
	type: 'object',
	fields: [
		defineField({
			name: 'name',
			title: 'Step name',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'text',
			title: 'Instructions',
			type: 'text',
			rows: 3,
			validation: (Rule) => Rule.required(),
		}),
		defineField({ name: 'image', title: 'Step image', type: 'imageWithAlt' }),
	],
	preview: { select: { title: 'name', subtitle: 'text' } },
});

/**
 * Step-by-step guide block. Renders as a numbered steps section and feeds
 * HowTo structured data (name, steps, totalTime, estimatedCost).
 */
export const howTo = defineType({
	name: 'howTo',
	title: 'How-to steps',
	type: 'object',
	description: 'Use for tutorial-style posts. Renders a numbered steps section and adds HowTo structured data.',
	fields: [
		defineField({
			name: 'name',
			title: 'Title',
			type: 'string',
			description: 'e.g. "How to trim your dog\'s nails". Defaults to the article title.',
		}),
		defineField({
			name: 'totalTime',
			title: 'Total time (ISO 8601)',
			type: 'string',
			description: 'e.g. PT10M for 10 minutes, PT1H30M for 1.5 hours.',
			validation: (Rule) => Rule.regex(/^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/).warning('Use an ISO 8601 duration, e.g. PT10M.'),
		}),
		defineField({
			name: 'estimatedCost',
			title: 'Estimated cost',
			type: 'string',
			description: 'Optional, e.g. "under $20".',
		}),
		defineField({
			name: 'steps',
			title: 'Steps',
			type: 'array',
			of: [defineArrayMember({ type: 'howToStep' })],
			validation: (Rule) => Rule.min(3).warning('Google needs at least 3 steps for HowTo markup to be meaningful.'),
		}),
	],
	preview: {
		select: { title: 'name', steps: 'steps' },
		prepare: ({ title, steps }) => ({
			title: title || 'How-to steps',
			subtitle: Array.isArray(steps) ? `${steps.length} step${steps.length === 1 ? '' : 's'}` : undefined,
		}),
	},
});
