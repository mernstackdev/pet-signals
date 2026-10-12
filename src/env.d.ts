/// <reference types="astro/client" />

interface ImportMetaEnv {
	/** Sanity project id — safe to expose (see cms/.env.example). */
	readonly PUBLIC_SANITY_PROJECT_ID: string;
	/** Sanity dataset name. Defaults to "production". */
	readonly PUBLIC_SANITY_DATASET?: string;
	/** Build-time read token, injected for server code (never reaches the browser). */
	readonly SANITY_API_READ_TOKEN?: string;
}
