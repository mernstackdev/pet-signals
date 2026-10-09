import type { APIRoute } from 'astro';

import { SITE } from '../lib/site';

const AI_CRAWLERS = [
	'GPTBot',
	'OAI-SearchBot',
	'ChatGPT-User',
	'ClaudeBot',
	'anthropic-ai',
	'PerplexityBot',
	'Google-Extended',
	'Applebot-Extended',
	'Amazonbot',
	'cohere-ai',
	'CCBot',
];

export const GET: APIRoute = () => {
	const lines = ['User-agent: *', 'Allow: /', ''];
	lines.push('# AI crawlers — explicitly allowed so our guides can be cited in AI answers.', '');
	for (const crawler of AI_CRAWLERS) {
		lines.push(`User-agent: ${crawler}`, 'Allow: /', '');
	}
	lines.push(`Sitemap: ${SITE.url}/sitemap-index.xml`, '');

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
