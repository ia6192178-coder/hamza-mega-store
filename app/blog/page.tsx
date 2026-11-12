const POSTS = [
  {
    title: '10 Kitchen Essentials Every Pakistani Home Needs',
    excerpt:
      'From a good non-stick pan to a reliable kettle — the kitchen tools that make daily cooking faster, easier and more fun.',
    image:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80',
    date: 'November 2026',
  },
  {
    title: 'How to Organise a Small Home on a Budget',
    excerpt:
      'Storage boxes, shoe racks and closet organisers — simple, affordable ideas to make a small home feel spacious.',
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    date: 'November 2026',
  },
  {
    title: 'Home Workout Basics: Start Fitness Without a Gym',
    excerpt:
      'A yoga mat, a pair of dumbbells and 20 minutes a day — everything you need to start your fitness journey at home.',
    image:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    date: 'November 2026',
  },
];

export default function BlogPage() {
  return (
    <div className="page-wrap">
      <h1 className="page-title">Our Blog</h1>
      <p className="page-subtitle">
        Shopping guides, home ideas and product tips from the Hamza Mega Store
        team.
      </p>

      <div className="blog-grid">
        {POSTS.map((post) => (
          <article key={post.title} className="blog-card">
            <img src={post.image} alt={post.title} loading="lazy" />
            <div className="blog-card-body">
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 6px' }}>
                {post.date}
              </p>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
