import { defineField, defineType } from 'sanity';

/** Author / expert. Feeds the author box and Person structured data (E-E-A-T). */
export const author = defineType({
	name: 'author',
	title: 'Author',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: { source: 'name', maxLength: 64 },
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'jobTitle',
			title: 'Job title',
			type: 'string',
			description: 'e.g. "Veterinary Behavior Consultant". Used for Person schema and the author box.',
		}),
		defineField({
			name: 'bio',
			title: 'Bio',
			type: 'text',
			rows: 4,
			description: '2–4 sentences. Used in the author box and as the Person schema description.',
		}),
		defineField({
			name: 'avatar',
			title: 'Photo',
			type: 'imageWithAlt',
			description: 'A real photo of the author. Google uses this when stitching together the byline.',
		}),
		defineField({
			name: 'knowsAbout',
			title: 'Knows about',
			type: 'array',
			of: [{ type: 'string' }],
			options: { layout: 'tags' },
			description: 'Topics of expertise. Feeds Person schema "knowsAbout".',
		}),
		defineField({
			name: 'sameAs',
			title: 'Profile links',
			type: 'array',
			of: [{ type: 'url' }],
			description: 'LinkedIn, X, YouTube, professional profiles. Feeds Person schema "sameAs" to link the byline to a real identity.',
		}),
	],
	preview: {
		select: { title: 'name', subtitle: 'jobTitle', media: 'avatar' },
	},
});
