import type { APIRoute } from 'astro';

import { CLUSTERS } from '../lib/clusters';
import { getPosts, postPath } from '../lib/content';
import { absoluteUrl } from '../lib/seo';
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
		lines.push(`- [${post.data.title}](${absoluteUrl(postPath(post))}): ${post.data.description}`);
	}
	lines.push('', '## Feeds', '', `- [RSS](${absoluteUrl('/rss.xml')})`, '');

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
