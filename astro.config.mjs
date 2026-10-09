// @ts-check
import { defineConfig } from 'astro/config';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE = 'https://petsignals.info';
const CLUSTERS = ['pet-behavior', 'pet-habits', 'how-to-guides'];

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

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

const lastmodByUrl = buildLastmodMap();

// https://astro.build/config
export default defineConfig({
	site: SITE,
	trailingSlash: 'always',
	build: { format: 'directory' },
	redirects: {
		// Add 301s here when a published slug changes, e.g.
		// '/pet-behavior/old-slug/': '/pet-behavior/new-slug/',
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
