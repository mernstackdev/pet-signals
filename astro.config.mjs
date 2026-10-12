// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@sanity/client';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const CLUSTERS = ['pet-behavior', 'pet-habits', 'how-to-guides'];
const srcDir = fileURLToPath(new URL('./src', import.meta.url));
const SANITY_API_VERSION = '2026-01-01';

/**
 * Resolve the canonical site origin without hardcoding a domain.
 * Real environment variables win (Cloudflare/Vercel/Netlify inject these at build
 * time), then values from a local `.env` file, then localhost for development.
 */
function resolveSite(fileEnv) {
	const pick = (...keys) => {
		for (const key of keys) {
			const value = process.env[key] ?? fileEnv[key];
			if (value && String(value).trim()) return String(value).trim();
		}
		return undefined;
	};

	const found = pick(
		'SITE_URL',
		'PUBLIC_SITE_URL',
		'VERCEL_PROJECT_PRODUCTION_URL',
		'VERCEL_URL',
		'URL', // Netlify production
		'DEPLOY_PRIME_URL', // Netlify preview
		'CF_PAGES_URL', // Cloudflare Pages
		'DEPLOY_URL',
	);

	if (!found) return 'http://localhost:4321';
	const withProtocol = /^https?:\/\//.test(found) ? found : `https://${found}`;
	return withProtocol.replace(/\/+$/, '');
}

/** Git commit timestamp (ISO) for a file, used for accurate sitemap `lastmod`. */
function gitLastmod(absPath) {
	try {
		const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', absPath], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
		return out ? new Date(out).toISOString() : undefined;
	} catch {
		return undefined;
	}
}

function walk(dir) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? walk(path) : [path];
	});
}

/** Sitemap `lastmod` for the static pages (git-based; content comes from Sanity). */
function buildStaticLastmodMap() {
	const map = new Map();
	const pagesDir = join(srcDir, 'pages');

	for (const file of walk(pagesDir)) {
		const rel = relative(pagesDir, file).split(sep).join('/');
		let url;
		if (rel === 'index.astro') url = '/';
		else if (rel === 'articles/index.astro') url = '/articles/';
		else if (/^[^/[]+\.astro$/.test(rel)) url = `/${rel.replace(/\.astro$/, '')}/`;
		else continue;
		const lastmod = gitLastmod(file);
		if (lastmod) map.set(url, lastmod);
	}

	const clusterHubLastmod = gitLastmod(join(pagesDir, '[cluster]/index.astro'));
	if (clusterHubLastmod) {
		for (const cluster of CLUSTERS) map.set(`/${cluster}/`, clusterHubLastmod);
	}

	return map;
}

// Astro's defineConfig takes an object (unlike Vite's function form), so the site
// origin is resolved at module load. loadEnv() makes local `.env` values available.
const fileEnv = loadEnv(
	process.env.NODE_ENV === 'development' ? 'development' : 'production',
	process.cwd(),
	'',
);
const SITE = resolveSite(fileEnv);
const lastmodByUrl = buildStaticLastmodMap();

const isCI = Boolean(process.env.CI || process.env.CF_PAGES || process.env.WORKERS_CI);
const explicitSite = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || fileEnv.SITE_URL;
console.log(`[pet-signals] Site origin: ${SITE}`);
if (isCI && !explicitSite) {
	console.warn(
		'[pet-signals] WARNING: no SITE_URL set in the build environment. Canonical URLs,\n' +
			'the sitemap, RSS and llms.txt will use the localhost fallback. Set SITE_URL\n' +
			'(e.g. https://petsignals.info) as a build variable so production URLs are correct.',
	);
}

/** Posts live in Sanity, so their sitemap lastmod comes from the dataset, not git. */
function sanityLastmod() {
	return {
		name: 'pet-signals:sanity-lastmod',
		hooks: {
			'astro:config:setup': async () => {
				const pick = (key) => process.env[key] || fileEnv[key];
				const projectId = pick('PUBLIC_SANITY_PROJECT_ID');
				const dataset = pick('PUBLIC_SANITY_DATASET') || 'production';
				const token = pick('SANITY_API_READ_TOKEN');
				if (!projectId) return;

				try {
					const client = createClient({
						projectId,
						dataset,
						apiVersion: SANITY_API_VERSION,
						useCdn: false,
						...(token ? { token } : {}),
					});
					const rows = await client.fetch(
						`*[_type == "post" && !(_id in path("drafts.**"))]{
              "slug": slug.current, "cluster": category->slug,
              "lastmod": coalesce(updatedAt, _updatedAt)
            }`,
					);
					for (const row of rows) {
						if (row.slug && row.cluster && row.lastmod) {
							lastmodByUrl.set(`/${row.cluster}/${row.slug}/`, new Date(row.lastmod).toISOString());
						}
					}
					console.log(`[pet-signals] Sitemap lastmod: ${rows.length} posts from Sanity`);
				} catch (error) {
					console.warn(
						`[pet-signals] Could not read post lastmod from Sanity (${error?.message ?? error}); sitemap will omit it for posts.`,
					);
				}
			},
		},
	};
}

// https://astro.build/config
export default defineConfig({
	site: SITE,
	trailingSlash: 'always',
	// Inline the stylesheet so there is no render-blocking request and no
	// HTML → CSS critical chain. First paint then depends only on the HTML,
	// which keeps Speed Index fast and stable on slow mobile connections.
	build: { format: 'directory', inlineStylesheets: 'always' },
	// The dev toolbar injects its own links and scripts, which pollutes
	// Lighthouse runs against `astro dev`. Disable it so dev audits are meaningful.
	devToolbar: { enabled: false },
	redirects: {
		// Prefer `public/_redirects` on Cloudflare for real 301s; keep this map in
		// sync if the same URL changes need to work on other hosts.
		// e.g. '/pet-behavior/old-slug/': '/pet-behavior/new-slug/',
	},
	integrations: [
		sanityLastmod(),
		sitemap({
			filter: (page) => !page.includes('/404') && !page.endsWith('.md'),
			serialize(item) {
				const { pathname } = new URL(item.url);
				const lastmod = lastmodByUrl.get(pathname);
				if (lastmod) item.lastmod = lastmod;
				return item;
			},
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
