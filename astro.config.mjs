// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const CLUSTERS = ['pet-behavior', 'pet-habits', 'how-to-guides'];
const srcDir = fileURLToPath(new URL('./src', import.meta.url));

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

/** Maps sitemap URLs to the git last-modified date of the file that produces them. */
function buildLastmodMap() {
	const map = new Map();

	for (const file of walk(join(srcDir, 'content/blog'))) {
		if (!/\.mdx?$/.test(file)) continue;
		const slug = file.split(sep).pop().replace(/\.mdx?$/, '');
		const lastmod = gitLastmod(file);
		if (lastmod) for (const cluster of CLUSTERS) map.set(`/${cluster}/${slug}/`, lastmod);
	}

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
const lastmodByUrl = buildLastmodMap();

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
		mdx(),
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
