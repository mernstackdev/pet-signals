import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Table for Portable Text.
 *
 * The shape (headerRows + rows → cells → value blocks) is the canonical one that
 * Studio's built-in table editing binds to. `headerRows` MUST stay declared —
 * the editor strips undeclared fields, which silently breaks the header toggle.
 */
export const table = defineType({
	name: 'table',
	title: 'Table',
	type: 'object',
	fields: [
		defineField({
			name: 'caption',
			title: 'Caption',
			type: 'string',
			description: 'Optional. Rendered as a <caption> above the table.',
		}),
		defineField({
			name: 'headerRows',
			title: 'Header rows',
			type: 'number',
			initialValue: 1,
			description: 'How many rows at the top are header cells. Use 0 for a headerless table.',
			validation: (Rule) => Rule.integer().min(0).max(2),
		}),
		defineField({
			name: 'rows',
			title: 'Rows',
			type: 'array',
			of: [
				defineArrayMember({
					name: 'row',
					title: 'Row',
					type: 'object',
					fields: [
						defineField({
							name: 'cells',
							title: 'Cells',
							type: 'array',
							of: [
								defineArrayMember({
									name: 'cell',
									title: 'Cell',
									type: 'object',
									fields: [
										defineField({
											name: 'value',
											title: 'Content',
											type: 'array',
											of: [
												defineArrayMember({
													type: 'block',
													styles: [{ title: 'Normal', value: 'normal' }],
													lists: [],
													marks: {
														decorators: [
															{ title: 'Bold', value: 'strong' },
															{ title: 'Italic', value: 'em' },
															{ title: 'Code', value: 'code' },
														],
													},
												}),
											],
										}),
									],
								}),
							],
						}),
					],
				}),
			],
		}),
	],
	preview: {
		select: { caption: 'caption', rows: 'rows' },
		prepare: ({ caption, rows }) => ({
			title: caption || 'Table',
			subtitle: Array.isArray(rows) ? `${rows.length} row${rows.length === 1 ? '' : 's'}` : undefined,
		}),
	},
});
