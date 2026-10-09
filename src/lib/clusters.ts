export const CLUSTER_SLUGS = ['pet-behavior', 'pet-habits', 'how-to-guides'] as const;

export type ClusterSlug = (typeof CLUSTER_SLUGS)[number];

export interface Cluster {
	slug: ClusterSlug;
	name: string;
	/** H1 + schema name — descriptive. */
	title: string;
	/** Concise <title> tag variant. */
	seoTitle: string;
	description: string;
	intro: string;
	accent: 'amber' | 'teal' | 'violet';
}

export const CLUSTERS: Cluster[] = [
	{
		slug: 'pet-behavior',
		name: 'Pet Behavior',
		title: 'Pet Behavior Guides: Why Pets Do What They Do',
		seoTitle: 'Pet Behavior Guides & Insights',
		description:
			'Understand pet behavior: why dogs bark, why cats knead, and what body language, stress signals, and instincts really mean for owners in the US and UK.',
		intro:
			'Behavior is communication. These guides decode the signals behind barking, scratching, hissing, zoomies, and everything in between so you can respond to the cause, not just the symptom.',
		accent: 'amber',
	},
	{
		slug: 'pet-habits',
		name: 'Pet Habits',
		title: 'Pet Habits: Daily Routines, Sleep, Feeding & Grooming',
		seoTitle: 'Pet Habits: Routines, Sleep & Feeding',
		description:
			'Build better pet habits around sleep, feeding, exercise, and grooming. Practical routines that fit real homes and keep dogs and cats healthy and calm.',
		intro:
			'Habits are the routines your pet builds around sleep, feeding, play, and grooming. Small, consistent changes here prevent most day-to-day problems before they start.',
		accent: 'teal',
	},
	{
		slug: 'how-to-guides',
		name: 'How-To Guides',
		title: 'Pet How-To Guides: Step-by-Step Care Instructions',
		seoTitle: 'Pet How-To Guides: Step-by-Step Care',
		description:
			'Step-by-step how-to guides for pet care: training, nail trims, crate training, enrichment, and more. Clear instructions you can follow today.',
		intro:
			'Practical, step-by-step instructions for the tasks owners actually get stuck on — from nail trims to crate training — written to be followed, not just read.',
		accent: 'violet',
	},
];

export function getCluster(slug: string): Cluster | undefined {
	return CLUSTERS.find((cluster) => cluster.slug === slug);
}
