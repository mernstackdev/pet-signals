import { toImageRef, type SanityImageRef } from './images';
import { portableTextToPlainText, type PtBlock } from './portable-text';
import { fetchAllPosts, fetchAuthors, imageUrl } from './sanity';

/**
 * Content layer.
 *
 * Templates consume the same shapes they did when content came from Markdown, so
 * swapping the source only required changing this file plus the Portable Text
 * renderer. Sanity documents are adapted into `{ id, data, body, blocks }` below.
 */

export interface Author {
	id: string;
	data: {
		name: string;
		jobTitle?: string;
		bio?: string;
		knowsAbout: string[];
		sameAs: string[];
		avatar?: SanityImageRef;
	};
}

export interface PostImage extends SanityImageRef {
	/** CDN URL, used for Open Graph and JSON-LD. */
	src: string;
}

export interface Post {
	/** URL slug (also the Sanity document slug). */
	id: string;
	/** Plain text of the body — used for reading time and the Markdown export. */
	body: string;
	/** Portable Text, rendered by components/blog/PortableText.astro. */
	blocks: PtBlock[];
	data: {
		title: string;
		description: string;
		cluster: string;
		publishDate: Date;
		updatedDate?: Date;
		author: Author;
		heroImage?: PostImage;
		heroImageAlt?: string;
		tags: string[];
		featured: boolean;
		faq: { question: string; answer: string }[];
		howTo?: { name?: string; totalTime?: string; steps: { name: string; text: string }[] };
		relatedSlugs: string[];
		seo?: { title?: string; description?: string; canonical?: string; noindex?: boolean };
	};
}

/* ------------------------------------------------------------------ mapping */

function adaptAuthor(raw: any): Author {
	return {
		id: raw?.slug ?? 'unknown',
		data: {
			name: raw?.name ?? '',
			jobTitle: raw?.jobTitle,
			bio: raw?.bio,
			knowsAbout: raw?.knowsAbout ?? [],
			sameAs: raw?.sameAs ?? [],
			avatar: toImageRef(raw?.avatar),
		},
	};
}

function adaptPost(raw: any): Post {
	const heroImage = toImageRef(raw.heroImage);
	const blocks = (raw.body ?? []) as PtBlock[];
	const steps = raw.howTo?.steps ?? [];

	return {
		id: raw.slug,
		body: portableTextToPlainText(blocks),
		blocks,
		data: {
			title: raw.title,
			// `excerpt` is the card/summary text; the SEO override lives in seo.description.
			description: raw.excerpt ?? '',
			cluster: raw.cluster,
			publishDate: new Date(raw.publishedAt),
			updatedDate: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
			author: adaptAuthor(raw.author),
			heroImage: heroImage ? { ...heroImage, src: imageUrl(heroImage.ref) ?? '' } : undefined,
			heroImageAlt: heroImage?.alt,
			tags: raw.tags ?? [],
			featured: Boolean(raw.featured),
			faq: (raw.faq ?? []).filter((item: any) => Boolean(item?.question)),
			howTo: steps.length
				? {
						name: raw.howTo.name,
						totalTime: raw.howTo.totalTime,
						steps: steps.map((step: any) => ({ name: step.name, text: step.text })),
					}
				: undefined,
			relatedSlugs: raw.relatedSlugs ?? [],
			seo: {
				title: raw.seo?.metaTitle,
				description: raw.seo?.metaDescription,
				canonical: raw.seo?.canonicalUrl,
				noindex: raw.seo?.noindex,
			},
		},
	};
}

/* ------------------------------------------------------------------ queries */

// One fetch per build — pages call these several times each.
let cachedPosts: Promise<Post[]> | undefined;

export function getPosts(): Promise<Post[]> {
	cachedPosts ??= fetchAllPosts().then((docs) =>
		docs
			.map(adaptPost)
			.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf()),
	);
	return cachedPosts;
}

export async function getPostsByCluster(cluster: string): Promise<Post[]> {
	const posts = await getPosts();
	return posts.filter((post) => post.data.cluster === cluster);
}

export async function getFeaturedPosts(limit = 3): Promise<Post[]> {
	const posts = await getPosts();
	const featured = posts.filter((post) => post.data.featured);
	return (featured.length ? featured : posts).slice(0, limit);
}

/** Manually related posts first, then the rest of the same cluster, then recent. */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
	const posts = await getPosts();
	const bySlug = new Map(posts.map((entry) => [entry.id, entry]));
	const manual = post.data.relatedSlugs
		.map((slug) => bySlug.get(slug))
		.filter((entry): entry is Post => Boolean(entry));
	const others = posts.filter((candidate) => candidate.id !== post.id && !manual.includes(candidate));
	const sameCluster = others.filter((candidate) => candidate.data.cluster === post.data.cluster);
	const rest = others.filter((candidate) => candidate.data.cluster !== post.data.cluster);
	return [...manual, ...sameCluster, ...rest].slice(0, limit);
}

/** The author document is embedded in the post, so this is a lookup, not a fetch. */
export async function getAuthor(post: Post): Promise<Author | undefined> {
	return post.data.author?.data?.name ? post.data.author : undefined;
}

/** All authors, for the About page. */
export async function getAuthors(): Promise<Author[]> {
	return (await fetchAuthors()).map(adaptAuthor);
}

/** Canonical site path for a post, e.g. `/pet-behavior/why-dogs-bark/`. */
export function postPath(post: Post): string {
	return `/${post.data.cluster}/${post.id}/`;
}
