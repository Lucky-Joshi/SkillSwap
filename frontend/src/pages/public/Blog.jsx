import { motion } from 'framer-motion';
import { FiArrowRight, FiClock, FiTag } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo';
import { blogPosts } from '../../data/blogPosts';
import { SITE_URL } from '../../utils/constants';
import { ROUTES } from '../../utils/routes';

const blogListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'SkillSwap Blog',
  description:
    'Guides on peer-to-peer learning, mentorship, and skill exchange for college students.',
  url: `${SITE_URL}/blog`,
  blogPost: blogPosts.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    url: `${SITE_URL}/blog/${p.slug}`,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt,
    author: { '@type': 'Organization', name: p.author },
  })),
};

export function articleJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: post.author, url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'SkillSwap', url: SITE_URL },
    keywords: post.keywords.join(', '),
  };
}

function ArticleCard({ post, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="mb-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          <FiTag className="h-3 w-3" aria-hidden="true" />
          {post.category}
        </span>
        <span className="inline-flex items-center gap-1">
          <FiClock className="h-3 w-3" aria-hidden="true" />
          {post.readingTime} min read
        </span>
        <time dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </time>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        <Link
          to={`/blog/${post.slug}`}
          className="transition hover:text-brand-600 dark:hover:text-brand-400"
          aria-label={`Read article: ${post.title}`}
        >
          {post.title}
        </Link>
      </h2>

      <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {post.description}
      </p>

      <Link
        to={`/blog/${post.slug}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition group-hover:gap-2 dark:text-brand-400"
        aria-label={`Read the full guide: ${post.title}`}
      >
        Read guide
        <FiArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </motion.article>
  );
}

export default function Blog() {
  useSeo({
    title: 'Blog — Peer Learning, Mentorship & Skill Exchange Guides',
    description:
      'Practical guides on peer-to-peer learning, finding mentors in college, the protégé effect, and the most in-demand skills students are exchanging.',
    path: '/blog',
    jsonLd: blogListJsonLd,
  });

  return (
    <div className="px-4 pb-24 pt-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            SkillSwap Blog
          </h1>
          <p className="mx-auto max-w-2xl text-base text-gray-600 dark:text-gray-400">
            Research-backed guides on peer learning, student mentorship, and getting
            better at anything by teaching it.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          {blogPosts.map((post, i) => (
            <ArticleCard key={post.slug} post={post} index={i} />
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center dark:border-brand-500/20 dark:bg-brand-500/10">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            Ready to turn reading into doing?
          </p>
          <Link
            to={ROUTES.REGISTER}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            aria-label="Create your free SkillSwap account"
          >
            Join SkillSwap free
            <FiArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
