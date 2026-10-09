import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

import { schemaTypes } from './schema';
import { structure } from './structure';

export default defineConfig({
	name: 'pet-signals',
	title: 'Pet Signals CMS',

	projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
	dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',

	plugins: [structureTool({ structure }), visionTool()],

	schema: {
		types: schemaTypes,
		// Posts are the primary content; templates only offer the ones that make sense.
		templates: (templates) => templates.filter(({ schemaType }) => !['siteSettings'].includes(schemaType)),
	},

	form: {
		components: {
			portableText: {
				// Table editing is built in from Studio v6.6 but disabled by default.
				plugins: (props) =>
					props.renderDefault({
						...props,
						plugins: { ...props.plugins, table: { enabled: true } },
					}),
			},
		},
	},
});
