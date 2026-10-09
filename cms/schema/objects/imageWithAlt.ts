import { defineField, defineType } from 'sanity';

/**
 * Image with the accessibility/SEO fields that matter: alt text and an optional
 * caption (rendered as <figcaption>, which Google treats as image context).
 */
export const imageWithAlt = defineType({
	name: 'imageWithAlt',
	title: 'Image',
	type: 'image',
	options: { hotspot: true },
	fields: [
		defineField({
			name: 'alt',
			title: 'Alt text',
			type: 'string',
			description:
				'Describe the image factually — "[type] of [subject] [context]". Leave empty only for purely decorative images.',
			validation: (Rule) => Rule.max(125).warning('Alt text is most useful under ~125 characters.'),
		}),
		defineField({
			name: 'caption',
			title: 'Caption',
			type: 'string',
			description: 'Optional. Rendered under the image and read by screen readers after the alt text.',
		}),
	],
	preview: {
		select: { title: 'alt', subtitle: 'caption', media: 'asset' },
		prepare: ({ title, subtitle, media }) => ({ title: title || 'Image (missing alt text)', subtitle, media }),
	},
});
