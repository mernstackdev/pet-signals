import { createClient } from '@sanity/client';

import { buildImageSrcSet, buildImageUrl } from './images';

/**
 * Sanity data access for the frontend.
 *
 * Everything here runs at build time (the site is statically generated), so the
 * read token is used only by the build and never reaches the browser bundle.
 */
export const sanityProjectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
export const sanityDataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';

/** Only needed while the dataset is private (ours is). */
const readToken = typeof process !== 'undefined' ? process.env.SANITY_API_READ_TOKEN : undefined;

if (!sanityProjectId) {
	throw new Error(
		'PUBLIC_SANITY_PROJECT_ID is not set. Copy .env.example to .env and add your Sanity project id.',
	);
}

export const sanityClient = createClient({
	projectId: sanityProjectId,
	dataset: sanityDataset,
	apiVersion: '2026-01-01',
	// Hit the API directly (not the CDN) so a build right after publishing sees fresh content.
	useCdn: false,
	perspective: 'published',
	...(readToken ? { token: readToken } : {}),
});

/* ------------------------------------------------------------------ images */

export const imageUrl = (ref: string, options?: { width?: number; height?: number; quality?: number }) =>
	buildImageUrl(sanityProjectId, sanityDataset, ref, options);

export const imageSrcSet = (ref: string, widths: number[], options?: { quality?: number }) =>
	buildImageSrcSet(sanityProjectId, sanityDataset, ref, widths, options);

/* ------------------------------------------------------------------ queries */

/** `body[]{ ... }` keeps the Portable Text; markDefs are dereferenced so internal links resolve. */
const POST_PROJECTION = `{
  _id, _updatedAt, title, "slug": slug.current, excerpt,
  "cluster": category->slug,
  "categoryName": category->name,
  author->{ _id, name, "slug": slug.current, jobTitle, bio, knowsAbout, sameAs, avatar{ alt, "ref": asset._ref } },
  publishedAt, updatedAt,
  heroImage{ alt, caption, "ref": asset._ref },
  body[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => { "target": reference->{ "_type": _type, "slug": slug.current, "cluster": category->slug } }
    }
  },
  tags, featured,
  faq[]{ question, answer },
  howTo{ name, totalTime, estimatedCost, steps[]{ name, text, image{ alt, caption, "ref": asset._ref } } },
  "relatedSlugs": relatedPosts[]->slug.current,
  seo{
    metaTitle, metaDescription, canonicalUrl, noindex, keywords,
    openGraph{ title, description, image{ alt, "ref": asset._ref } },
    twitter{ card, title, description, image{ alt, "ref": asset._ref } }
  }
}`;

export async function fetchAllPosts() {
	return sanityClient.fetch<any[]>(
		`*[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc)${POST_PROJECTION}`,
	);
}

export async function fetchPostLastmods() {
	return sanityClient.fetch<{ slug: string; cluster: string; lastmod: string }[]>(
		`*[_type == "post" && !(_id in path("drafts.**"))]{
      "slug": slug.current, "cluster": category->slug,
      "lastmod": coalesce(updatedAt, _updatedAt)
    }`,
	);
}

export async function fetchSiteSettings() {
	return sanityClient.fetch<any>(`*[_id == "siteSettings"][0]{
    siteName, siteUrl, tagline, organizationName, twitterHandle, contactEmail, sameAs,
    organizationLogo{ alt, "ref": asset._ref },
    defaults{ metaTitle, metaDescription, ogImage{ alt, "ref": asset._ref } }
  }`);
}

export async function fetchCategories() {
	return sanityClient.fetch<any[]>(`*[_type == "category"] | order(slug asc){
    _id, name, slug, heading, intro, accent, seo{ metaTitle, metaDescription }
  }`);
}

export async function fetchAuthors() {
	return sanityClient.fetch<any[]>(`*[_type == "author"] | order(name asc){
    _id, name, "slug": slug.current, jobTitle, bio, knowsAbout, sameAs,
    avatar{ alt, caption, "ref": asset._ref }
  }`);
}
