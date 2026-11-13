// Blog posts (v5). Posts live in the `blog_posts` table and the owner
// manages them from the Admin Panel — this file holds the seed posts (the
// 3 originals, used as the fallback when the table is missing and seeded
// into the table by the migration), the slug helpers, and the shared
// validation for the admin API.

export type SeedBlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  image_url: string;
  created_at: string;
};

// The 3 original blog posts. The bodies are new (the originals only had
// excerpts), written in the same friendly tone so the article pages have
// something real to show. The created_at dates keep the original list
// order when posts are shown newest first.
export const SEED_BLOG_POSTS: SeedBlogPost[] = [
  {
    title: '10 Kitchen Essentials Every Pakistani Home Needs',
    slug: '10-kitchen-essentials-every-pakistani-home-needs',
    excerpt:
      'From a good non-stick pan to a reliable kettle — the kitchen tools that make daily cooking faster, easier and more fun.',
    body: [
      'A good kitchen does not need expensive gadgets — it needs the right basics. Whether you cook daal chawal every day or only make chai on the weekends, these ten essentials will make your kitchen work better.',
      'Start with a heavy non-stick frying pan and a fast-boil kettle. A good pan handles parathas, omelettes and stir-fry without sticking, and a kettle saves you ten minutes every morning. Add a sharp knife set — cooking with a blunt knife is slow and unsafe — and a sturdy dinner set for family meals.',
      'Storage matters too. Stackable boxes keep your masalas and dry goods fresh and easy to find, and a simple organiser clears the clutter from your counters. Finish with the small things: a good cutting board, mixing bowls, and a set of steel glasses that last for years.',
      'You can find all of these in our Kitchen & Dining collection — quality pieces at honest prices, delivered to your door with Cash on Delivery.',
    ].join('\n\n'),
    image_url:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80',
    created_at: '2026-11-02T00:00:00Z',
  },
  {
    title: 'How to Organise a Small Home on a Budget',
    slug: 'how-to-organise-a-small-home-on-a-budget',
    excerpt:
      'Storage boxes, shoe racks and closet organisers — simple, affordable ideas to make a small home feel spacious.',
    body: [
      'A small home does not have to feel crowded. With a few smart storage choices, you can free up space you did not know you had — and it does not cost much.',
      'Start with the closet. A hanging organiser adds six shelves to any wardrobe, and stackable boxes turn a messy shelf into neat rows. Shoes are the other big space-eater: a compact shoe rack by the door keeps eighteen pairs tidy in one small corner.',
      'In the bathroom, a simple organiser set keeps toothbrushes, soap and bottles off the sink. In the living room, a storage box can hide toys, cables and clutter while doubling as a side table.',
      'The rule is simple: everything should have a place. Browse our Organizers collection for affordable pieces that make a small home feel spacious.',
    ].join('\n\n'),
    image_url:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    created_at: '2026-11-06T00:00:00Z',
  },
  {
    title: 'Home Workout Basics: Start Fitness Without a Gym',
    slug: 'home-workout-basics-start-fitness-without-a-gym',
    excerpt:
      'A yoga mat, a pair of dumbbells and 20 minutes a day — everything you need to start your fitness journey at home.',
    body: [
      'You do not need a gym membership to get fit. With a yoga mat, a pair of dumbbells and twenty minutes a day, you can build strength and energy at home — on your own schedule.',
      'Start with the basics: a non-slip yoga mat for stretching and floor exercises, and an adjustable dumbbell set so you can increase the weight as you get stronger. A weighing scale helps you track progress week by week.',
      'Keep it simple. Ten minutes of stretching, ten minutes of strength — push-ups, squats and dumbbell rows. Three or four days a week is enough to feel the difference within a month.',
      'Check our Health & Fitness collection for mats, dumbbells and scales at honest prices — everything you need to start, delivered to your door.',
    ].join('\n\n'),
    image_url:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    created_at: '2026-11-10T00:00:00Z',
  },
];

export const MAX_POST_TITLE_LENGTH = 120;
export const MAX_POST_EXCERPT_LENGTH = 300;
export const MAX_POST_BODY_LENGTH = 50000;
// One uploaded photo is ~100–200KB after browser compression; ~1.5M
// characters of base64 is roughly 1.1MB of binary — anything bigger is
// rejected so a single photo can never blow up the request (same cap as
// product photos).
const MAX_POST_IMAGE_CHARS = 1_500_000;

// Page address for a post title — same pattern as slugifyCategory:
// lowercase, "&" becomes "and", everything else non-alphanumeric becomes
// a dash.
export function slugifyBlogTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pure slug-uniqueness helper: given a base slug and the slugs already in
// use, return the base when free, or base-2, base-3, … when taken.
// Testable without a database; the database layer just fetches the list.
export function makeUniqueSlug(base: string, existing: string[]): string {
  const taken = new Set(existing);
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

// User-facing blog errors (bad input, not found). API routes map these to
// 4xx; anything else is a 500.
export class BlogInputError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'BlogInputError';
    this.status = status;
  }
}

export type BlogPostInput = {
  title: string;
  excerpt: string;
  body: string;
  image_url: string;
};

// Shared validation for blog create/update payloads (admin API).
export function parseBlogPostBody(
  body: Record<string, unknown>,
): { post?: BlogPostInput; error?: string } {
  const title = String(body.title ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  let excerpt = String(body.excerpt ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  // Normalise line endings and trim blank lines at the edges; inner line
  // breaks are kept — the article page renders paragraphs from them.
  const postBody = String(body.body ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/^\n+|\n+$/g, '');
  const image_url = String(body.image_url ?? '').trim();

  if (!title) return { error: 'Post title is required.' };
  if (title.length > MAX_POST_TITLE_LENGTH) {
    return {
      error: `Title must be ${MAX_POST_TITLE_LENGTH} characters or less.`,
    };
  }
  if (!slugifyBlogTitle(title)) {
    return { error: 'Title must contain at least one letter or number.' };
  }
  if (excerpt.length > MAX_POST_EXCERPT_LENGTH) {
    return {
      error: `Summary must be ${MAX_POST_EXCERPT_LENGTH} characters or less.`,
    };
  }
  if (postBody.length > MAX_POST_BODY_LENGTH) {
    return { error: 'The article text is too long — please shorten it.' };
  }
  if (image_url.length > MAX_POST_IMAGE_CHARS) {
    return { error: 'The photo is too large — please choose a smaller photo.' };
  }

  // No summary given — use the start of the article as the list excerpt.
  if (!excerpt && postBody) {
    const flat = postBody.replace(/\s+/g, ' ');
    excerpt =
      flat.length > 160 ? `${flat.slice(0, 157).trimEnd()}…` : flat;
  }

  return { post: { title, excerpt, body: postBody, image_url } };
}

// "13 November 2026" for a stored timestamp; falls back to the raw value
// when it cannot be parsed.
export function formatPostDate(createdAt: string | undefined): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return createdAt;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
