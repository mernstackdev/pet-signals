import { defineArrayMember, defineType } from 'sanity';

/**
 * Article body (Portable Text).
 *
 * Headings start at h2 on purpose: the page title is the only <h1>, which keeps
 * the document outline valid for SEO and screen readers.
 */
export const blockContent = defineType({
	name: 'blockContent',
	title: 'Body',
	type: 'array',
	of: [
		defineArrayMember({
			type: 'block',
			styles: [
				{ title: 'Normal', value: 'normal' },
				{ title: 'Heading 2', value: 'h2' },
				{ title: 'Heading 3', value: 'h3' },
				{ title: 'Heading 4', value: 'h4' },
				{ title: 'Quote', value: 'blockquote' },
			],
			lists: [
				{ title: 'Bulleted list', value: 'bullet' },
				{ title: 'Numbered list', value: 'number' },
			],
			marks: {
				decorators: [
					{ title: 'Bold', value: 'strong' },
					{ title: 'Italic', value: 'em' },
					{ title: 'Underline', value: 'underline' },
					{ title: 'Strike', value: 'strike-through' },
					{ title: 'Code', value: 'code' },
				],
				annotations: [{ type: 'link' }, { type: 'internalLink' }],
			},
		}),
		defineArrayMember({ type: 'imageWithAlt' }),
		defineArrayMember({ type: 'table' }),
		defineArrayMember({ type: 'callout' }),
		defineArrayMember({ type: 'pullQuote' }),
		defineArrayMember({ type: 'codeBlock' }),
	],
});
