import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;
export type Author = CollectionEntry<'authors'>;

/** All published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

/** Published posts in one cluster, newest first. */
export async function getPostsByCluster(cluster: string): Promise<Post[]> {
	const posts = await getPosts();
	return posts.filter((post) => post.data.cluster === cluster);
}

/** Posts flagged for the homepage, newest first. */
export async function getFeaturedPosts(limit = 3): Promise<Post[]> {
	const posts = await getPosts();
	const featured = posts.filter((post) => post.data.featured);
	return (featured.length ? featured : posts).slice(0, limit);
}

/** Related posts: same cluster first, then recent posts from other clusters. */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
	const posts = await getPosts();
	const others = posts.filter((candidate) => candidate.id !== post.id);
	const sameCluster = others.filter((candidate) => candidate.data.cluster === post.data.cluster);
	const rest = others.filter((candidate) => candidate.data.cluster !== post.data.cluster);
	return [...sameCluster, ...rest].slice(0, limit);
}

export async function getAuthor(post: Post): Promise<Author | undefined> {
	return getEntry(post.data.author);
}

/** Canonical site path for a post, e.g. `/pet-behavior/why-dogs-bark/`. */
export function postPath(post: Post): string {
	return `/${post.data.cluster}/${post.id}/`;
}
