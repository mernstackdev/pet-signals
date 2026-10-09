import type { StructureBuilder } from 'sanity/structure';

/** Studio sidebar: content first, then taxonomy, then the site-wide singleton. */
export const structure = (S: StructureBuilder) =>
	S.list()
		.title('Content')
		.items([
			S.listItem()
				.title('Posts')
				.id('posts')
				.child(
					S.documentTypeList('post')
						.title('Posts')
						.defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
				),
			S.divider(),
			S.listItem()
				.title('Categories')
				.id('categories')
				.child(S.documentTypeList('category').title('Categories')),
			S.listItem()
				.title('Authors')
				.id('authors')
				.child(S.documentTypeList('author').title('Authors')),
			S.divider(),
			S.listItem()
				.title('Site settings')
				.id('siteSettings')
				.child(S.document().schemaType('siteSettings').documentId('siteSettings')),
		]);
