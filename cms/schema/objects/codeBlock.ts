import { defineField, defineType } from 'sanity';

/** Plain code block. Swap for @sanity/code-input if you want syntax highlighting. */
export const codeBlock = defineType({
	name: 'codeBlock',
	title: 'Code block',
	type: 'object',
	fields: [
		defineField({
			name: 'language',
			title: 'Language',
			type: 'string',
			initialValue: 'text',
			options: {
				list: [
					{ title: 'Plain text', value: 'text' },
					{ title: 'Bash', value: 'bash' },
					{ title: 'JSON', value: 'json' },
					{ title: 'JavaScript', value: 'js' },
					{ title: 'CSS', value: 'css' },
					{ title: 'HTML', value: 'html' },
				],
			},
		}),
		defineField({
			name: 'code',
			title: 'Code',
			type: 'text',
			rows: 8,
			validation: (Rule) => Rule.required(),
		}),
		defineField({ name: 'filename', title: 'Filename', type: 'string', description: 'Optional label, e.g. "astro.config.mjs".' }),
	],
	preview: {
		select: { title: 'filename', language: 'language', code: 'code' },
		prepare: ({ title, language, code }) => ({ title: title || `Code (${language ?? 'text'})`, subtitle: (code ?? '').slice(0, 80) }),
	},
});
