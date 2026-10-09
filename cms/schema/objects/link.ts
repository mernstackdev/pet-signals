import { defineField, defineType } from 'sanity';

/**
 * External link annotation. Named `link` with an `href` string so the Portable
 * Text editor's "paste a URL onto selected text" behaviour keeps working.
 */
export const link = defineType({
	name: 'link',
	title: 'External link',
	type: 'object',
	fields: [
		defineField({
			name: 'href',
			title: 'URL',
			type: 'url',
			validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
		}),
		defineField({
			name: 'openInNewTab',
			title: 'Open in a new tab',
			type: 'boolean',
			initialValue: false,
			description: 'Use sparingly — mostly for reference material the reader will come back from.',
		}),
	],
});
