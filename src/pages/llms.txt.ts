import type { APIRoute } from 'astro';

import { CLUSTERS } from '../lib/clusters';
import { getPosts, postPath } from '../lib/content';
import { absoluteUrl, canonicalUrl, markdownUrlFor } from '../lib/seo';
import { SITE } from '../lib/site';

export const GET: APIRoute = async () => {
	const posts = await getPosts();
	const lines: string[] = [];

	lines.push(`# ${SITE.name}`, '');
	lines.push(`> ${SITE.description}`, '');
	lines.push('## Topics', '');
	for (const cluster of CLUSTERS) {
		lines.push(`- [${cluster.name}](${absoluteUrl(`/${cluster.slug}/`)}): ${cluster.description}`);
	}
	lines.push(`- [All articles](${absoluteUrl('/articles/')}): every published guide, newest first`, '');
	lines.push('## Articles', '');
	for (const post of posts) {
		const markdown = markdownUrlFor(canonicalUrl(postPath(post)));
		lines.push(`- [${post.data.title}](${markdown}): ${post.data.description}`);
	}
	lines.push('', '## Full text', '');
	lines.push(`- [All articles as one Markdown document](${absoluteUrl('/llms-full.txt')})`);
	lines.push('', '## Feeds', '', `- [RSS](${absoluteUrl('/rss.xml')})`, '');

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
