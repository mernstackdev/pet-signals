import { SITE } from './site';
import { formatDate, isoDate, readingTime } from './seo';
import { portableTextToMarkdown } from './portable-text';
import type { Author, Post } from './content';

/**
 * Renders a post as a clean Markdown document for LLMs and the "Copy page" action.
 * Mirrors the visible article: byline, body, how-to steps, and FAQ.
 */
export function articleMarkdown(opts: { post: Post; author?: Author; canonical: string }): string {
	const { post, author, canonical } = opts;
	const data = post.data;
	const lines: string[] = [];

	lines.push(`# ${data.title}`, '');
	lines.push(`> ${data.description}`, '');

	const meta: string[] = [];
	if (author) {
		meta.push(`**By ${author.data.name}**${author.data.jobTitle ? `, ${author.data.jobTitle}` : ''}`);
	}
	meta.push(`Published ${formatDate(data.publishDate)}`);
	if (data.updatedDate && isoDate(data.updatedDate) !== isoDate(data.publishDate)) {
		meta.push(`Updated ${formatDate(data.updatedDate)}`);
	}
	meta.push(`${readingTime(post.body ?? '')} min read`);
	lines.push(meta.join(' · '), '');
	lines.push(`Source: ${canonical}`, '');
	lines.push('---', '');
	lines.push(portableTextToMarkdown(post.blocks).trim(), '');

	if (data.howTo?.steps?.length) {
		lines.push('---', '');
		lines.push(`## ${data.howTo.name ?? 'Step-by-step'}`, '');
		data.howTo.steps.forEach((step, index) => {
			lines.push(`${index + 1}. **${step.name}** — ${step.text}`);
		});
		lines.push('');
	}

	if (data.faq.length) {
		lines.push('---', '');
		lines.push('## Frequently asked questions', '');
		for (const item of data.faq) {
			lines.push(`### ${item.question}`, '');
			lines.push(item.answer, '');
		}
	}

	lines.push('---', '');
	lines.push(`${SITE.name} — ${SITE.url}`);

	return lines.join('\n');
}
