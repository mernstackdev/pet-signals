import { post } from './documents/post';
import { author } from './documents/author';
import { category } from './documents/category';
import { siteSettings } from './documents/siteSettings';

import { seo } from './objects/seo';
import { imageWithAlt } from './objects/imageWithAlt';
import { blockContent } from './objects/blockContent';
import { table } from './objects/table';
import { callout } from './objects/callout';
import { codeBlock } from './objects/codeBlock';
import { pullQuote } from './objects/pullQuote';
import { faqItem } from './objects/faqItem';
import { howTo, howToStep } from './objects/howTo';
import { link } from './objects/link';
import { internalLink } from './objects/internalLink';

export const schemaTypes = [
	// documents
	post,
	author,
	category,
	siteSettings,
	// objects & blocks
	seo,
	imageWithAlt,
	blockContent,
	table,
	callout,
	codeBlock,
	pullQuote,
	faqItem,
	howTo,
	howToStep,
	link,
	internalLink,
];
