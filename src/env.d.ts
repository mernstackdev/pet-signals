/// <reference types="astro/client" />

interface ImportMetaEnv {
	/** Sanity project id — safe to expose (see cms/.env.example). */
	readonly PUBLIC_SANITY_PROJECT_ID: string;
	/** Sanity dataset name. Defaults to "production". */
	readonly PUBLIC_SANITY_DATASET?: string;
}
