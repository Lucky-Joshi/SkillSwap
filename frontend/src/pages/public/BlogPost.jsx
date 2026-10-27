import { motion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiClock, FiUser } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import useSeo from '../../hooks/useSeo';
import { blogPosts, getPostBySlug } from '../../data/blogPosts';
import { articleJsonLd } from './Blog';
import { ROUTES } from '../../utils/routes';

function Related({ currentSlug, category }) {
  const related = blogPosts.filter((p) => p.slug !== currentSlug && p.category === category);
  const fallback = blogPosts.filter((p) => p.slug !== currentSlug && p.category !== category);
  const list = [...related, ...fallback].slice(0, 2);

  return (
    <aside className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Keep reading
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            className="rounded-xl border border-gray-200 p-4 transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-gray-800 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
            aria-label={`Read: ${p.title}`}
          >
            <span className="mb-1 block text-xs font-medium text-brand-600 dark:text-brand-400">
              {p.category}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {p.title}
            </span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  useSeo({
    title: post ? post.title : 'Article not found',
    description: post ? post.description : 'This article could not be found.',
    path: `/blog/${slug || ''}`,
    type: 'article',
    jsonLd: post ? articleJsonLd(post) : null,
  });

  if (!post) {
    return (
      <div className="px-4 pb-24 pt-16 text-center sm:px-6">
        <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
          Article not found
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The article you are looking for does not exist or was moved.
        </p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to all articles
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-10 sm:px-6">
      <article className="mx-auto max-w-2xl" itemScope itemType="https://schema.org/BlogPosting">
        <Link
          to="/blog"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
          All articles
        </Link>

        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              {post.category}
            </span>
            <time dateTime={post.publishedAt} itemProp="datePublished">
              {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
            <span className="inline-flex items-center gap-1">
              <FiClock className="h-3 w-3" aria-hidden="true" />
              {post.readingTime} min read
            </span>
            <span className="inline-flex items-center gap-1">
              <FiUser className="h-3 w-3" aria-hidden="true" />
              {post.author}
            </span>
          </div>

          <h1
            className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl dark:text-white"
            itemProp="headline"
          >
            {post.title}
          </h1>
          <meta itemProp="description" content={post.description} />
        </header>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-base font-medium leading-relaxed text-gray-700 dark:text-gray-300"
          itemProp="description"
        >
          {post.intro}
        </motion.p>

        <div className="space-y-8">
          {post.body.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {section.heading}
              </h2>
              {section.paragraphs.map((para, i) => (
                <p
                  key={i}
                  className="mb-3 text-base leading-relaxed text-gray-600 dark:text-gray-400"
                  itemProp="articleBody"
                >
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <footer className="mt-10 rounded-2xl bg-brand-600 p-6 text-white">
          <p className="mb-3 text-sm font-medium">
            Swap the skill you have for the skill you want — free, with verified
            peers from your college.
          </p>
          <Link
            to={ROUTES.REGISTER}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            aria-label="Create your free SkillSwap account"
          >
            Get started on SkillSwap
            <FiArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </footer>

        <Related currentSlug={post.slug} category={post.category} />
      </article>
    </div>
  );
}
