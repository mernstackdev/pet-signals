/**
 * Portable Text → HTML / plain text / Markdown.
 *
 * Pure functions with no Astro or env dependencies, so the rendering logic can be
 * checked directly (see the verification script in cms/scripts).
 */
import { toImageRef, type SanityImageRef } from './images';

export interface PtSpan {
	_type?: string;
	_key?: string;
	text?: string;
	marks?: string[];
}

export interface PtMarkDef {
	_type?: string;
	_key?: string;
	href?: string;
	openInNewTab?: boolean;
	target?: { _type?: string; slug?: string; cluster?: string };
}

export interface PtBlock {
	_type: string;
	_key?: string;
	style?: string;
	listItem?: string;
	level?: number;
	children?: PtSpan[];
	markDefs?: PtMarkDef[];
	[key: string]: any;
}

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function headingSlug(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
}

/** Resolve a link mark definition to an href. */
function linkHref(def: PtMarkDef): string | undefined {
	if (def._type === 'link') return def.href;
	if (def._type === 'internalLink' && def.target?.slug) {
		return def.target._type === 'post' && def.target.cluster
			? `/${def.target.cluster}/${def.target.slug}/`
			: `/${def.target.slug}/`;
	}
	return undefined;
}

/** Inline spans → HTML. */
export function renderInline(block: PtBlock): string {
	const markDefs = new Map((block.markDefs ?? []).map((def) => [def._key ?? '', def]));
	return (block.children ?? [])
		.map((span) => {
			let html = escapeHtml(span.text ?? '').replace(/\n/g, '<br />');
			for (const mark of span.marks ?? []) {
				const def = markDefs.get(mark);
				if (def) {
					const href = linkHref(def);
					if (href) {
						const attrs = def.openInNewTab ? ' target="_blank" rel="noopener"' : '';
						html = `<a href="${escapeHtml(href)}"${attrs}>${html}</a>`;
					}
					continue;
				}
				if (mark === 'strong') html = `<strong>${html}</strong>`;
				else if (mark === 'em') html = `<em>${html}</em>`;
				else if (mark === 'underline') html = `<u>${html}</u>`;
				else if (mark === 'strike-through') html = `<s>${html}</s>`;
				else if (mark === 'code') html = `<code>${html}</code>`;
			}
			return html;
		})
		.join('');
}

/** Plain text of one block (used for slugs, reading time and Markdown export). */
export function blockText(block: PtBlock): string {
	return (block.children ?? []).map((span) => span.text ?? '').join('');
}

/** Headings for the table of contents, mirroring the ids the renderer emits. */
export function portableTextHeadings(blocks: PtBlock[]) {
	return blocks
		.filter((block) => block._type === 'block' && (block.style === 'h2' || block.style === 'h3'))
		.map((block) => ({
			depth: Number((block.style ?? 'h2').slice(1)),
			slug: headingSlug(blockText(block)),
			text: blockText(block),
		}));
}

export function portableTextToPlainText(blocks: PtBlock[]): string {
	return blocks
		.map((block) => {
			if (block._type === 'block') return blockText(block);
			if (block._type === 'table') return tableRows(block).flat().join(' ');
			return '';
		})
		.filter(Boolean)
		.join('\n\n');
}

/* ------------------------------------------------------------------- tables */

/** Table rows as an array of cells, each cell being HTML. */
export function tableRows(block: PtBlock): string[][] {
	return (block.rows ?? []).map((row: any) =>
		(row.cells ?? []).map((cell: any) =>
			(cell.value ?? [])
				.map((child: PtBlock) => (child._type === 'block' ? renderInline(child) : ''))
				.join(' '),
		),
	);
}

/* --------------------------------------------------------- render planning */

export type PtRenderItem =
	| { kind: 'text'; key: string; html: string }
	| { kind: 'list'; key: string; ordered: boolean; items: { key: string; html: string }[] }
	| { kind: 'image'; key: string; image: SanityImageRef }
	| { kind: 'table'; key: string; caption?: string; headerRows: number; rows: string[][] }
	| { kind: 'callout'; key: string; tone?: string; title?: string; body?: string }
	| { kind: 'pullQuote'; key: string; quote?: string; attribution?: string }
	| { kind: 'code'; key: string; language?: string; filename?: string; code?: string };

let fallbackKey = 0;
const keyOf = (block: PtBlock) => block._key ?? `b${fallbackKey++}`;

/**
 * Turn the flat Portable Text array into a render plan: consecutive list items are
 * grouped into one list, and text blocks become ready-to-inject HTML.
 */
export function groupBlocks(blocks: PtBlock[]): PtRenderItem[] {
	const items: PtRenderItem[] = [];
	let list: Extract<PtRenderItem, { kind: 'list' }> | undefined;

	for (const block of blocks) {
		if (block._type === 'block' && (block.listItem === 'bullet' || block.listItem === 'number')) {
			const ordered = block.listItem === 'number';
			if (list && list.ordered === ordered) {
				list.items.push({ key: keyOf(block), html: renderInline(block) });
			} else {
				list = { kind: 'list', key: `list-${keyOf(block)}`, ordered, items: [{ key: keyOf(block), html: renderInline(block) }] };
				items.push(list);
			}
			continue;
		}

		list = undefined;

		switch (block._type) {
			case 'block': {
				const style = block.style ?? 'normal';
				const html = renderInline(block);
				if (style === 'h2' || style === 'h3' || style === 'h4') {
					const id = headingSlug(blockText(block));
					items.push({ kind: 'text', key: keyOf(block), html: `<${style} id="${id}">${html}</${style}>` });
				} else if (style === 'blockquote') {
					items.push({ kind: 'text', key: keyOf(block), html: `<blockquote><p>${html}</p></blockquote>` });
				} else {
					items.push({ kind: 'text', key: keyOf(block), html: `<p>${html}</p>` });
				}
				break;
			}
			case 'imageWithAlt': {
				const image = toImageRef(block);
				if (image) items.push({ kind: 'image', key: keyOf(block), image });
				break;
			}
			case 'table':
				items.push({
					kind: 'table',
					key: keyOf(block),
					caption: block.caption,
					headerRows: Number(block.headerRows ?? 1),
					rows: tableRows(block),
				});
				break;
			case 'callout':
				items.push({ kind: 'callout', key: keyOf(block), tone: block.tone, title: block.title, body: block.body });
				break;
			case 'pullQuote':
				items.push({ kind: 'pullQuote', key: keyOf(block), quote: block.quote, attribution: block.attribution });
				break;
			case 'codeBlock':
				items.push({ kind: 'code', key: keyOf(block), language: block.language, filename: block.filename, code: block.code });
				break;
			default:
				break;
		}
	}

	return items;
}

/* ------------------------------------------------------------ html / markdown */

/** Full HTML for a body (used by the RSS feed). */
export function portableTextToHtml(blocks: PtBlock[]): string {
	return groupBlocks(blocks)
		.map((item) => {
			switch (item.kind) {
				case 'text':
					return item.html;
				case 'list': {
					const tag = item.ordered ? 'ol' : 'ul';
					return `<${tag}>${item.items.map((entry) => `<li>${entry.html}</li>`).join('')}</${tag}>`;
				}
				case 'table': {
					const [head, ...body] = item.rows;
					const header =
						item.headerRows > 0 && head ? `<thead><tr>${head.map((cell) => `<th>${cell}</th>`).join('')}</tr></thead>` : '';
					const rows = (item.headerRows > 0 ? body : item.rows)
						.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
						.join('');
					return `<table>${item.caption ? `<caption>${escapeHtml(item.caption)}</caption>` : ''}${header}<tbody>${rows}</tbody></table>`;
				}
				case 'callout':
					return `<aside><p>${escapeHtml(item.body ?? '')}</p></aside>`;
				case 'pullQuote':
					return `<blockquote><p>${escapeHtml(item.quote ?? '')}</p></blockquote>`;
				case 'code':
					return `<pre><code>${escapeHtml(item.code ?? '')}</code></pre>`;
				case 'image':
					return '';
				default:
					return '';
			}
		})
		.join('\n');
}

/** Markdown for a body (used by the per-article `.md` endpoint). */
export function portableTextToMarkdown(blocks: PtBlock[]): string {
	const inlineMarkdown = (block: PtBlock): string => {
		const markDefs = new Map((block.markDefs ?? []).map((def) => [def._key ?? '', def]));
		return (block.children ?? [])
			.map((span) => {
				let text = span.text ?? '';
				for (const mark of span.marks ?? []) {
					const def = markDefs.get(mark);
					const href = def ? linkHref(def) : undefined;
					if (href) text = `[${text}](${href})`;
					else if (mark === 'strong') text = `**${text}**`;
					else if (mark === 'em') text = `*${text}*`;
					else if (mark === 'code') text = `\`${text}\``;
				}
				return text;
			})
			.join('');
	};

	return blocks
		.map((block) => {
			if (block._type === 'block') {
				const text = inlineMarkdown(block);
				const style = block.style ?? 'normal';
				if (style === 'h2') return `## ${text}`;
				if (style === 'h3') return `### ${text}`;
				if (style === 'h4') return `#### ${text}`;
				if (style === 'blockquote') return `> ${text}`;
				if (block.listItem === 'bullet') return `- ${text}`;
				if (block.listItem === 'number') return `1. ${text}`;
				return text;
			}
			if (block._type === 'table') {
				const rows = tableRows(block).map((row) => row.map((cell) => cell.replace(/<[^>]+>/g, '').replace(/\|/g, '\\|')));
				if (!rows.length) return '';
				const [head, ...body] = rows;
				return [
					`| ${head.join(' | ')} |`,
					`| ${head.map(() => '---').join(' | ')} |`,
					...body.map((row) => `| ${row.join(' | ')} |`),
				].join('\n');
			}
			if (block._type === 'pullQuote') return `> ${block.quote ?? ''}`;
			if (block._type === 'callout') return `> ${block.title ? `**${block.title}** ` : ''}${block.body ?? ''}`;
			if (block._type === 'codeBlock') return `\`\`\`${block.language ?? ''}\n${block.code ?? ''}\n\`\`\``;
			return '';
		})
		.filter(Boolean)
		.join('\n\n');
}
