import type { APIRoute } from 'astro';

import { getAuthor, getPosts, postPath } from '../lib/content';
import { articleMarkdown } from '../lib/markdown';
import { canonicalUrl } from '../lib/seo';
import { SITE } from '../lib/site';

/** Full-text bundle for AI agents that fetch everything in one request. */
export const GET: APIRoute = async () => {
	const posts = await getPosts();
	const parts: string[] = [`# ${SITE.name} — full text`, '', `> ${SITE.description}`, ''];

	for (const post of posts) {
		const author = await getAuthor(post);
		parts.push('', '---', '');
		parts.push(articleMarkdown({ post, author, canonical: canonicalUrl(postPath(post)) }));
	}

	return new Response(parts.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
