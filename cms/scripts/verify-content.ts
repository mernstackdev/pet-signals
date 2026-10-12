/**
 * Read back the dataset to confirm what the import produced.
 *
 *   npm run verify:content
 *
 * Uses the same credentials as the importer (cms/.env).
 */
import { createClient } from '@sanity/client';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cmsDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
try {
	process.loadEnvFile(join(cmsDir, '.env'));
} catch {
	// no .env
}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';
if (!projectId) {
	console.error('SANITY_STUDIO_PROJECT_ID is not set in cms/.env');
	process.exit(1);
}

const client = createClient({
	projectId,
	dataset,
	apiVersion: '2026-01-01',
	token: process.env.SANITY_API_WRITE_TOKEN,
	useCdn: false,
});

const counts = await client.fetch(`{
  "posts": count(*[_type == "post"]),
  "authors": count(*[_type == "author"]),
  "categories": count(*[_type == "category"]),
  "siteSettings": count(*[_type == "siteSettings"]),
  "imageAssets": count(*[_type == "sanity.imageAsset"])
}`);

console.log(`${projectId}/${dataset}`);
console.log(
	`  posts ${counts.posts} · authors ${counts.authors} · categories ${counts.categories} · siteSettings ${counts.siteSettings} · image assets ${counts.imageAssets}`,
);
if (counts.posts === 0) {
	console.error('\nNo posts found — did the import run?');
	process.exit(1);
}

const posts = await client.fetch(`*[_type == "post"] | order(publishedAt desc) {
  _id, title, "slug": slug.current,
  "category": category->slug,
  "categoryName": category->name,
  "author": author->name,
  publishedAt, updatedAt,
  "heroUrl": heroImage.asset->url, "heroAlt": heroImage.alt,
  "blocks": count(body), "faq": count(faq), "steps": count(howTo.steps),
  "keywords": seo.keywords
}`);

console.log('\nPosts:');
for (const post of posts) {
	const flags = [
		post.heroUrl ? 'image ok' : 'NO IMAGE',
		post.category ? `category ${post.category}` : 'NO CATEGORY',
		post.author ? `author ${post.author}` : 'NO AUTHOR',
		`${post.blocks} blocks`,
		post.faq ? `${post.faq} FAQ` : 'no FAQ',
		post.steps ? `${post.steps} steps` : '',
	]
		.filter(Boolean)
		.join(' · ');
	console.log(`  ${post.slug}`);
	console.log(`    ${post.title}`);
	console.log(`    ${post.publishedAt}${post.updatedAt ? ` (updated ${post.updatedAt})` : ''}`);
	console.log(`    ${flags}`);
	if (post.heroUrl) console.log(`    hero: ${post.heroUrl.split('?')[0]}`);
}

const categories = await client.fetch(`*[_type == "category"] | order(slug) { _id, name, slug, accent }`);
console.log('\nCategories:');
for (const category of categories) console.log(`  ${category.slug} — ${category.name} (${category.accent})`);

const settings = await client.fetch(`*[_id == "siteSettings"][0]{ siteName, siteUrl, organizationName }`);
console.log('\nSite settings:', JSON.stringify(settings));
