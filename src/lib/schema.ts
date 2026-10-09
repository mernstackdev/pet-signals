import { SITE } from './site';
import { absoluteUrl } from './seo';
import { getCluster } from './clusters';
import { postPath, type Author, type Post } from './content';

type JsonLd = Record<string, unknown>;

export const ORG_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

function graph(nodes: Array<JsonLd | undefined | false>): JsonLd {
	return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}

export function organization(): JsonLd {
	return {
		'@type': 'Organization',
		'@id': ORG_ID,
		name: SITE.name,
		url: SITE.url,
		description: SITE.description,
		logo: {
			'@type': 'ImageObject',
			url: absoluteUrl(SITE.logo),
			width: SITE.logoWidth,
			height: SITE.logoHeight,
		},
		email: SITE.email,
		sameAs: [...SITE.sameAs],
	};
}

export function website(): JsonLd {
	return {
		'@type': 'WebSite',
		'@id': WEBSITE_ID,
		url: SITE.url,
		name: SITE.name,
		description: SITE.description,
		inLanguage: SITE.locale,
		publisher: { '@id': ORG_ID },
	};
}

export function personNode(author: Author, basePath = '/about'): JsonLd {
	return {
		'@type': 'Person',
		'@id': `${SITE.url}${basePath}/#${author.id}`,
		name: author.data.name,
		jobTitle: author.data.jobTitle,
		description: author.data.bio,
		url: absoluteUrl(`${basePath}/#${author.id}`),
		knowsAbout: author.data.knowsAbout,
		sameAs: author.data.sameAs,
	};
}

export function webpageNode(opts: {
	url: string;
	type?: string;
	title: string;
	description: string;
	breadcrumbId?: string;
}): JsonLd {
	return {
		'@type': opts.type ?? 'WebPage',
		'@id': `${opts.url}#webpage`,
		url: opts.url,
		name: opts.title,
		description: opts.description,
		isPartOf: { '@id': WEBSITE_ID },
		inLanguage: SITE.locale,
		about: { '@id': ORG_ID },
		breadcrumb: opts.breadcrumbId ? { '@id': opts.breadcrumbId } : undefined,
	};
}

export function breadcrumbNode(items: Array<{ name: string; url?: string }>, pageUrl: string): JsonLd {
	return {
		'@type': 'BreadcrumbList',
		'@id': `${pageUrl}#breadcrumb`,
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};
}

export function itemListNode(opts: { url: string; name: string; posts: Post[] }): JsonLd {
	return {
		'@type': 'ItemList',
		'@id': `${opts.url}#itemlist`,
		name: opts.name,
		numberOfItems: opts.posts.length,
		itemListOrder: 'https://schema.org/ItemListOrderDescending',
		itemListElement: opts.posts.map((post, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			url: absoluteUrl(postPath(post)),
			name: post.data.title,
		})),
	};
}

/** Article page: Organization + WebSite + WebPage + BlogPosting + Person + Breadcrumb (+ HowTo). */
export function articleGraph(opts: {
	url: string;
	post: Post;
	author?: Author;
	imageUrl?: string;
	imageWidth?: number;
	imageHeight?: number;
}): JsonLd {
	const { url, post, author } = opts;
	const cluster = getCluster(post.data.cluster);
	const pageId = `${url}#webpage`;
	const breadcrumbId = `${url}#breadcrumb`;
	const nodes: Array<JsonLd | undefined | false> = [
		organization(),
		website(),
		webpageNode({
			url,
			title: post.data.seo?.title ?? post.data.title,
			description: post.data.description,
			breadcrumbId,
		}),
	];

	if (opts.imageUrl) {
		nodes.push({
			'@type': 'ImageObject',
			'@id': `${url}#primaryimage`,
			url: opts.imageUrl,
			width: opts.imageWidth,
			height: opts.imageHeight,
		});
	}

	nodes.push({
		'@type': 'BlogPosting',
		'@id': `${url}#article`,
		headline: post.data.title,
		description: post.data.description,
		image: opts.imageUrl ? { '@id': `${url}#primaryimage` } : undefined,
		datePublished: post.data.publishDate.toISOString(),
		dateModified: (post.data.updatedDate ?? post.data.publishDate).toISOString(),
		author: author ? { '@id': `${SITE.url}/about/#${author.id}` } : { '@id': ORG_ID },
		publisher: { '@id': ORG_ID },
		mainEntityOfPage: { '@id': pageId },
		isPartOf: { '@id': WEBSITE_ID },
		inLanguage: SITE.locale,
		articleSection: cluster?.name,
		keywords: post.data.tags.length ? post.data.tags.join(', ') : undefined,
	});

	if (author) nodes.push(personNode(author));

	nodes.push(
		breadcrumbNode(
			[
				{ name: 'Home', url: absoluteUrl('/') },
				{ name: 'Articles', url: absoluteUrl('/articles/') },
				{ name: cluster?.name ?? 'Articles', url: cluster ? absoluteUrl(`/${cluster.slug}/`) : undefined },
				{ name: post.data.title },
			],
			url,
		),
	);

	if (post.data.howTo?.steps?.length) {
		nodes.push({
			'@type': 'HowTo',
			'@id': `${url}#howto`,
			name: post.data.howTo.name ?? post.data.title,
			description: post.data.description,
			totalTime: post.data.howTo.totalTime,
			step: post.data.howTo.steps.map((step, index) => ({
				'@type': 'HowToStep',
				position: index + 1,
				name: step.name,
				text: step.text,
			})),
		});
	}

	return graph(nodes);
}

/** Cluster hub page: Organization + WebSite + CollectionPage + ItemList + Breadcrumb. */
export function clusterGraph(opts: {
	url: string;
	clusterName: string;
	title: string;
	description: string;
	posts: Post[];
}): JsonLd {
	const breadcrumbId = `${opts.url}#breadcrumb`;
	return graph([
		organization(),
		website(),
		webpageNode({
			url: opts.url,
			type: 'CollectionPage',
			title: opts.title,
			description: opts.description,
			breadcrumbId,
		}),
		itemListNode({ url: opts.url, name: `${opts.clusterName} articles`, posts: opts.posts }),
		breadcrumbNode(
			[
				{ name: 'Home', url: absoluteUrl('/') },
				{ name: opts.clusterName },
			],
			opts.url,
		),
	]);
}

/** Landing page: Organization + WebSite + WebPage + ItemList(featured). */
export function homeGraph(opts: { url: string; featured: Post[] }): JsonLd {
	return graph([
		organization(),
		website(),
		webpageNode({ url: opts.url, title: SITE.title, description: SITE.description }),
		itemListNode({ url: opts.url, name: 'Featured articles', posts: opts.featured }),
	]);
}

/** Generic content page (about, contact, legal, archive): Organization + WebSite + typed WebPage. */
export function pageGraph(opts: {
	url: string;
	type?: string;
	title: string;
	description: string;
	breadcrumbs?: Array<{ name: string; url?: string }>;
	nodes?: JsonLd[];
}): JsonLd {
	const breadcrumbId = opts.breadcrumbs ? `${opts.url}#breadcrumb` : undefined;
	const nodes: Array<JsonLd | undefined | false> = [
		organization(),
		website(),
		webpageNode({
			url: opts.url,
			type: opts.type,
			title: opts.title,
			description: opts.description,
			breadcrumbId,
		}),
	];
	if (opts.breadcrumbs) nodes.push(breadcrumbNode(opts.breadcrumbs, opts.url));
	if (opts.nodes) nodes.push(...opts.nodes);
	return graph(nodes);
}

export { graph };
