import type { APIRoute } from 'astro';

import { getAuthor, getPosts, postPath, type Post } from '../../lib/content';
import { articleMarkdown } from '../../lib/markdown';
import { canonicalUrl } from '../../lib/seo';

export async function getStaticPaths() {
	const posts = await getPosts();
	return posts.map((post) => ({
		params: { cluster: post.data.cluster, slug: post.id },
		props: { post },
	}));
}

export const GET: APIRoute = async ({ props }) => {
	const { post } = props as { post: Post };
	const author = await getAuthor(post);
	const canonical = canonicalUrl(postPath(post));

	return new Response(articleMarkdown({ post, author, canonical }), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
};
