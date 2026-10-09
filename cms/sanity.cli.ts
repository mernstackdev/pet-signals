import { defineCliConfig } from 'sanity/cli';

/**
 * CLI + deployment configuration.
 * Values come from `.env` (prefix SANITY_STUDIO_ so they reach the browser bundle).
 */
export default defineCliConfig({
	api: {
		projectId: process.env.SANITY_STUDIO_PROJECT_ID,
		dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
	},
});
