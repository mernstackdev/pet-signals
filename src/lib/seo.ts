import { SITE } from './site';

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
	return new URL(path, SITE.url).toString();
}

/**
 * Canonical URL for a pathname: strips query/hash and enforces a trailing slash
 * so every duplicate variant collapses to one URL (matches Astro's `directory` build).
 */
export function canonicalUrl(pathname: string): string {
	const clean = pathname.split('?')[0].split('#')[0];
	const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
	return new URL(withSlash, SITE.url).toString();
}

/** Human-readable date, formatted in a locale-safe way (UTC to avoid off-by-one). */
export function formatDate(date: Date, locale = SITE.ogLocale.replace('_', '-')): string {
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC',
	}).format(date);
}

/** ISO-8601 date string (YYYY-MM-DD) for `<time datetime>` and schema. */
export function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/** Rough reading time in minutes, based on 200 words per minute. */
export function readingTime(body = ''): number {
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 200));
}
