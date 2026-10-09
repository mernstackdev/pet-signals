import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';

import { getPosts, postPath } from '../lib/content';
import { SITE } from '../lib/site';

export const GET: APIRoute = async (context) => {
	const posts = await getPosts();

	return rss({
		title: SITE.title,
		description: SITE.description,
		site: context.site ?? SITE.url,
		customData: '<language>en</language>',
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishDate,
			link: postPath(post),
			categories: [post.data.cluster, ...post.data.tags],
			content: post.rendered?.html ?? post.data.description,
		})),
	});
};
