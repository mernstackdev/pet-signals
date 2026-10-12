/**
 * Sanity image helpers. Pure functions (no env access) so they can be unit-tested.
 *
 * Asset refs look like `image-<hash>-1200x630-png`, which is all we need to build
 * a CDN URL and to get intrinsic dimensions for width/height (CLS-free).
 */
export interface SanityImageRef {
	ref: string;
	alt?: string;
	caption?: string;
	width: number;
	height: number;
}

export function parseImageRef(ref: string) {
	const match = /^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-(\w+)$/.exec(ref);
	if (!match) return undefined;
	return { id: match[1], width: Number(match[2]), height: Number(match[3]), format: match[4] };
}

/** Normalise an image field or inline image block into a SanityImageRef. */
export function toImageRef(node: any): SanityImageRef | undefined {
	const ref: string | undefined = node?.ref ?? node?.asset?._ref;
	if (!ref) return undefined;
	const parsed = parseImageRef(ref);
	if (!parsed) return undefined;
	return { ref, alt: node.alt, caption: node.caption, width: parsed.width, height: parsed.height };
}

export function buildImageUrl(
	projectId: string,
	dataset: string,
	ref: string,
	options: { width?: number; height?: number; quality?: number } = {},
): string | undefined {
	const parsed = parseImageRef(ref);
	if (!parsed) return undefined;
	const url = new URL(
		`https://cdn.sanity.io/images/${projectId}/${dataset}/${parsed.id}-${parsed.width}x${parsed.height}.${parsed.format}`,
	);
	if (options.width) url.searchParams.set('w', String(options.width));
	if (options.height) url.searchParams.set('h', String(options.height));
	url.searchParams.set('fit', 'max');
	url.searchParams.set('auto', 'format');
	url.searchParams.set('q', String(options.quality ?? 75));
	return url.toString();
}

export function buildImageSrcSet(
	projectId: string,
	dataset: string,
	ref: string,
	widths: number[],
	options: { quality?: number } = {},
): string {
	const intrinsic = parseImageRef(ref)?.width;
	const allowed = intrinsic ? widths.filter((width) => width <= intrinsic) : widths;
	const list = allowed.length ? allowed : [intrinsic ?? Math.max(...widths)];
	return list
		.map((width) => `${buildImageUrl(projectId, dataset, ref, { width, quality: options.quality })} ${width}w`)
		.join(', ');
}
