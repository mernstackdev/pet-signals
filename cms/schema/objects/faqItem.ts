import { defineField, defineType } from 'sanity';

/**
 * A single FAQ question/answer.
 *
 * Note: Google now shows FAQ rich results for very few sites, so treat this as
 * answer-engine (AEO) content first: write self-contained answers that read well
 * quoted out of context. It is also emitted as FAQPage structured data.
 */
export const faqItem = defineType({
	name: 'faqItem',
	title: 'FAQ item',
	type: 'object',
	fields: [
		defineField({
			name: 'question',
			title: 'Question',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'answer',
			title: 'Answer',
			type: 'text',
			rows: 3,
			description: 'Direct, self-contained answer — aim for 2–4 sentences that make sense on their own.',
			validation: (Rule) => Rule.required(),
		}),
	],
	preview: { select: { title: 'question', subtitle: 'answer' } },
});
