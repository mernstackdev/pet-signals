/**
 * Site origin. `site` in astro.config resolves to localhost during development and
 * to the deployment URL in production, so no domain is hardcoded here.
 */
const configuredSite = import.meta.env.SITE;
const SITE_URL = (configuredSite || 'http://localhost:4321').replace(/\/+$/, '');

export const SITE = {
	name: 'Pet Signals',
	url: SITE_URL,
	title: 'Pet Signals — Pet Behavior, Habits & How-To Guides',
	shortTitle: 'Pet Signals',
	tagline: 'Read your pet like a pro.',
	description:
		'Pet Signals explains pet behavior, daily habits, and practical how-to care guides for dog and cat owners in the US and UK. Clear, vet-informed advice.',
	locale: 'en',
	ogLocale: 'en_US',
	ogLocaleAlternate: 'en_GB',
	twitter: '@petsignals',
	email: 'hello@petsignals.info',
	logo: '/logo.png',
	logoWidth: 512,
	logoHeight: 512,
	defaultOgImage: '/og-default.png',
	ogImageWidth: 1200,
	ogImageHeight: 630,
	sameAs: [
		'https://www.instagram.com/petsignals',
		'https://www.pinterest.com/petsignals',
		'https://www.youtube.com/@petsignals',
	],
} as const;

export const NAV_LINKS = [
	{ href: '/pet-behavior/', label: 'Pet Behavior' },
	{ href: '/pet-habits/', label: 'Pet Habits' },
	{ href: '/how-to-guides/', label: 'How-To Guides' },
	{ href: '/articles/', label: 'All Articles' },
] as const;
