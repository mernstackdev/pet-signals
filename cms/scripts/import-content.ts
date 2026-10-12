/**
 * Import the seed content into Sanity.
 *
 *   npm run import:content   → writes cms/seed.ndjson (no credentials needed)
 *   npm run import:push      → uploads images and upserts into the dataset
 *                              (needs SANITY_API_WRITE_TOKEN in cms/.env)
 *
 * Source of truth for this one-off migration is the Markdown in
 * `src/content/blog/` plus `src/content/authors/`. After the frontend is wired to
 * Sanity those files are only seed material.
 *
 * Document ids are deterministic (post.<slug>, category.<slug>, author.<slug>,
 * siteSettings), so re-running is idempotent.
 */
import { createClient } from '@sanity/client';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

import { CLUSTERS } from '../../src/lib/clusters';

/* ------------------------------------------------------------------ setup */

const cmsDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const seedDir = join(cmsDir, 'seed');
const blogDir = join(seedDir, 'blog');
const authorsDir = join(seedDir, 'authors');

try {
	process.loadEnvFile(join(cmsDir, '.env'));
} catch {
	// no .env — fine for a dry run
}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;
const push = process.argv.includes('--push');

if (push && (!projectId || !token)) {
	console.error('--push needs SANITY_STUDIO_PROJECT_ID and SANITY_API_WRITE_TOKEN in cms/.env');
	process.exit(1);
}

/* ------------------------------------------------------- portable text (PT) */

let keyCounter = 0;
const key = () => `k${(keyCounter++).toString(36)}`;

const span = (text: string, marks: string[] = []) => ({ _type: 'span', _key: key(), text, marks });

type MarkDef = { _type: string; _key: string; [k: string]: unknown };

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*|_[^_]+_)/g;

/** Parse inline markdown into PT spans, collecting link markDefs. */
function inlineText(text: string, markDefs: MarkDef[] = []): any[] {
	const spans: any[] = [];
	let last = 0;
	for (const match of text.matchAll(INLINE)) {
		const index = match.index ?? 0;
		if (index > last) spans.push(span(text.slice(last, index)));
		const token = match[0];
		if (token.startsWith('**') || token.startsWith('__')) {
			spans.push(span(token.slice(2, -2), ['strong']));
		} else if (token.startsWith('`')) {
			spans.push(span(token.slice(1, -1), ['code']));
		} else if (token.startsWith('[')) {
			const parsed = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
			const defKey = key();
			markDefs.push({ _type: 'link', _key: defKey, href: parsed?.[2] ?? '', openInNewTab: false });
			spans.push(span(parsed?.[1] ?? token, [defKey]));
		} else {
			spans.push(span(token.slice(1, -1), ['em']));
		}
		last = index + token.length;
	}
	if (last < text.length) spans.push(span(text.slice(last)));
	return spans.length ? spans : [span(text)];
}

function textBlock(style: string, text: string, extra: Record<string, unknown> = {}) {
	const markDefs: MarkDef[] = [];
	const children = inlineText(text, markDefs);
	return {
		_type: 'block',
		_key: key(),
		style,
		markDefs,
		children: children.length ? children : [span('')],
		...extra,
	};
}

/** GFM pipe table → the `table` shape Studio's table editor binds to. */
function tableBlock(header: string[], rows: string[][]) {
	const toRow = (cells: string[]) => ({
		_type: 'row',
		_key: key(),
		cells: cells.map((cell) => ({
			_type: 'cell',
			_key: key(),
			value: [textBlock('normal', cell)],
		})),
	});
	return {
		_type: 'table',
		_key: key(),
		headerRows: 1,
		rows: [toRow(header), ...rows.map(toRow)],
	};
}

/**
 * Markdown → Portable Text.
 * Covers the subset the seed content uses: #/##/### headings, paragraphs,
 * bullet + numbered lists, block quotes, and inline bold/italic/code/links.
 * Headings are clamped to h2–h4 because the page title is the only h1.
 */
function markdownToPortableText(markdown: string) {
	const blocks: any[] = [];
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	let buffer: string[] = [];
	let index = 0;

	const flush = () => {
		const text = buffer.join(' ').trim();
		buffer = [];
		if (text) blocks.push(textBlock('normal', text));
	};

	while (index < lines.length) {
		const line = lines[index].trim();

		if (!line || /^([-*_])\1{2,}$/.test(line) || line.startsWith('```')) {
			flush();
			index++;
			continue;
		}

		const heading = /^(#{1,6})\s+(.*)$/.exec(line);
		if (heading) {
			flush();
			const depth = Math.min(Math.max(heading[1].length, 2), 4);
			blocks.push(textBlock(`h${depth}`, heading[2]));
			index++;
			continue;
		}

		// GFM pipe table (header row + `| --- |` delimiter)
		if (line.startsWith('|') && index + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[index + 1].trim())) {
			flush();
			const splitRow = (row: string) =>
				row
					.trim()
					.replace(/^\||\|$/g, '')
					.split('|')
					.map((cell) => cell.trim());
			const header = splitRow(line);
			index += 2;
			const rows: string[][] = [];
			while (index < lines.length && lines[index].trim().startsWith('|')) {
				rows.push(splitRow(lines[index].trim()));
				index++;
			}
			blocks.push(tableBlock(header, rows));
			continue;
		}

		if (/^>\s?/.test(line)) {
			flush();
			const quoteLines: string[] = [];
			while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
				quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
				index++;
			}
			// Keep the structure inside a quote: prose stays a blockquote, while
			// bullet/numbered lines become real list items.
			let paragraph: string[] = [];
			const flushQuote = () => {
				const text = paragraph.join(' ').trim();
				paragraph = [];
				if (text) blocks.push(textBlock('blockquote', text));
			};
			for (const quoteLine of quoteLines) {
				const trimmed = quoteLine.trim();
				const item = /^([-*+]|\d+[.)])\s+(.*)$/.exec(trimmed);
				if (item) {
					flushQuote();
					blocks.push(
						textBlock('normal', item[2].trim(), {
							listItem: /^\d/.test(item[1]) ? 'number' : 'bullet',
							level: 1,
						}),
					);
				} else if (!trimmed) {
					flushQuote();
				} else {
					paragraph.push(trimmed);
				}
			}
			flushQuote();
			continue;
		}

		if (/^([-*+]|\d+[.)])\s+/.test(line)) {
			flush();
			while (index < lines.length) {
				const item = lines[index].trim();
				const bullet = /^[-*+]\s+(.*)$/.exec(item);
				const ordered = /^\d+[.)]\s+(.*)$/.exec(item);
				if (!bullet && !ordered) break;
				blocks.push(
					textBlock('normal', (bullet ? bullet[1] : ordered![1]).trim(), {
						listItem: bullet ? 'bullet' : 'number',
						level: 1,
					}),
				);
				index++;
			}
			continue;
		}

		buffer.push(line);
		index++;
	}
	flush();
	return blocks;
}

/* ---------------------------------------------------------------- helpers */

function parseFrontmatter(raw: string) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
	if (!match) return { data: {} as Record<string, any>, content: raw };
	return {
		data: (parseYaml(match[1]) ?? {}) as Record<string, any>,
		content: raw.slice(match[0].length),
	};
}

const toIso = (value: unknown): string | undefined => {
	if (!value) return undefined;
	const date = value instanceof Date ? value : new Date(String(value));
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const slugFromFile = (file: string) => basename(file, extname(file));
const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'));

/* --------------------------------------------------------------- documents */

const categories = CLUSTERS.map((cluster) => ({
	_id: `category.${cluster.slug}`,
	_type: 'category',
	name: cluster.name,
	slug: cluster.slug,
	heading: cluster.title,
	intro: cluster.intro,
	accent: cluster.accent,
	seo: { _type: 'seo', metaTitle: cluster.seoTitle, metaDescription: cluster.description },
}));

const authors = readdirSync(authorsDir)
	.filter((file) => file.endsWith('.json'))
	.map((file) => {
		const slug = slugFromFile(file);
		const data = readJson(join(authorsDir, file));
		return {
			_id: `author.${slug}`,
			_type: 'author',
			name: data.name,
			slug: { _type: 'slug', current: slug },
			jobTitle: data.jobTitle,
			bio: data.bio,
			knowsAbout: data.knowsAbout ?? [],
			sameAs: data.sameAs ?? [],
		};
	});

/** Mirrors src/lib/site.ts, which can't be imported here because it reads import.meta.env. */
const siteSettings = {
	_id: 'siteSettings',
	_type: 'siteSettings',
	siteName: 'Pet Signals',
	siteUrl: 'https://petsignals.info',
	tagline: 'Read your pet like a pro.',
	organizationName: 'Pet Signals',
	sameAs: [
		'https://www.instagram.com/petsignals',
		'https://www.pinterest.com/petsignals',
		'https://www.youtube.com/@petsignals',
	],
	contactEmail: 'hello@petsignals.info',
	twitterHandle: '@petsignals',
	defaults: {
		metaTitle: 'Pet Signals — Pet Behavior, Habits & How-To Guides',
		metaDescription:
			'Pet Signals explains pet behavior, daily habits, and practical how-to care guides for dog and cat owners in the US and UK.',
	},
};

const postSources = readdirSync(blogDir)
	.filter((file) => /\.mdx?$/.test(file))
	.map((file) => {
		const { data, content } = parseFrontmatter(readFileSync(join(blogDir, file), 'utf8'));
		return { file, slug: slugFromFile(file), data, content };
	});

/** Frontmatter image paths are written relative to the .mdx file. */
const resolveAsset = (relative: string) => resolve(blogDir, relative);

/* ------------------------------------------------------------------- push */

const apiClient = () =>
	createClient({
		projectId: projectId!,
		dataset,
		apiVersion: '2026-01-01',
		token: token!,
		useCdn: false,
	});

/**
 * Upload an image, reusing the existing asset with the same filename so
 * re-running the import doesn't pile up duplicate assets.
 */
async function resolveAssetRef(file: string) {
	const client = apiClient();
	const filename = basename(file);
	const existing = await client.fetch<string | null>(
		`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`,
		{ filename },
	);
	if (existing) return existing;
	const asset = await client.assets.upload('image', readFileSync(file), { filename });
	return asset._id;
}

/* ------------------------------------------------------------------- main */

async function main() {
	const docs: any[] = [...categories, ...authors, siteSettings];

	for (const source of postSources) {
		const { data, content, slug } = source;
		const assetPath = data.heroImage ? resolveAsset(String(data.heroImage)) : undefined;

		let heroImage: Record<string, unknown> | undefined;
		if (assetPath) {
			if (push) {
				heroImage = {
					_type: 'imageWithAlt',
					alt: data.heroImageAlt ?? data.title,
					asset: { _type: 'reference', _ref: await resolveAssetRef(assetPath) },
				};
			} else {
				heroImage = {
					_type: 'imageWithAlt',
					alt: data.heroImageAlt ?? data.title,
					// `sanity dataset import` turns this into a real asset on import
					_sanityAsset: `image@${pathToFileURL(assetPath).href}`,
				};
			}
		}

		const howTo = data.howTo
			? {
					_type: 'howTo',
					name: data.howTo.name,
					totalTime: data.howTo.totalTime,
					steps: (data.howTo.steps ?? []).map((step: any) => ({
						_type: 'howToStep',
						_key: key(),
						name: step.name,
						text: step.text,
					})),
				}
			: undefined;

		docs.push({
			// `draft: true` in the frontmatter writes a Sanity draft (drafts.<id>),
			// so unfinished work lands in the dataset without going live.
			_id: `${data.draft ? 'drafts.' : ''}post.${slug}`,
			_type: 'post',
			title: data.title,
			slug: { _type: 'slug', current: slug },
			excerpt: data.description,
			category: { _type: 'reference', _ref: `category.${data.cluster}` },
			author: { _type: 'reference', _ref: `author.${data.author}` },
			publishedAt: toIso(data.publishDate),
			...(toIso(data.updatedDate) ? { updatedAt: toIso(data.updatedDate) } : {}),
			...(heroImage ? { heroImage } : {}),
			body: markdownToPortableText(content),
			tags: data.tags ?? [],
			featured: Boolean(data.featured),
			...(data.faq?.length
				? {
						faq: data.faq.map((item: any) => ({
							_type: 'faqItem',
							_key: key(),
							question: item.question,
							answer: item.answer,
						})),
					}
				: {}),
			...(howTo ? { howTo } : {}),
			seo: { _type: 'seo', keywords: data.tags ?? [] },
		});
	}

	const outFile = join(cmsDir, 'seed.ndjson');
	writeFileSync(outFile, `${docs.map((doc) => JSON.stringify(doc)).join('\n')}\n`);

	const posts = docs.filter((doc) => doc._type === 'post');
	console.log(`Built ${docs.length} documents from ${postSources.length} posts`);
	console.log(`  categories : ${categories.length}`);
	console.log(`  authors    : ${authors.length}`);
	console.log(`  posts      : ${posts.length}`);
	for (const post of posts) {
		console.log(
			`    - ${post._id}  (${post.body.length} body blocks, ${post.faq?.length ?? 0} FAQ, ${post.howTo?.steps.length ?? 0} steps)`,
		);
	}
	console.log(`\nWrote ${outFile}`);
	console.log(`Import without a token:  npx sanity dataset import seed.ndjson ${dataset}`);
	console.log(`Or push directly:        npm run import:push`);

	if (!push) {
		console.log('\nDry run (no writes). Use --push with SANITY_API_WRITE_TOKEN to write to the dataset.');
		return;
	}

	const transaction = apiClient().transaction();
	for (const doc of docs) transaction.createOrReplace(doc);
	const result = await transaction.commit();
	console.log(`\nPushed to ${projectId}/${dataset}: ${result.results.length} documents written.`);
}

await main();
