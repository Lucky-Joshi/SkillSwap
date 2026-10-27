import { useEffect } from 'react';
import { SITE_URL } from '../utils/constants';

function upsertMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [key, val] = attr.split('=');
    el.setAttribute(key, val);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

/**
 * Update <head> metadata for client-rendered pages: title, description,
 * canonical, Open Graph, Twitter cards and optional JSON-LD structured data.
 */
export default function useSeo({ title, description, path = '/', type = 'website', jsonLd = null }) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    const fullTitle = title ? `${title} | SkillSwap` : 'SkillSwap — Learn from peers. Teach your skills.';

    document.title = fullTitle;
    upsertMeta('meta[name="description"]', 'name=description', description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    upsertMeta('meta[property="og:title"]', 'property=og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property=og:description', description);
    upsertMeta('meta[property="og:url"]', 'property=og:url', url);
    upsertMeta('meta[property="og:type"]', 'property=og:type', type);
    upsertMeta('meta[name="twitter:card"]', 'name=twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name=twitter:title', fullTitle);
    upsertMeta('meta[name="twitter:description"]', 'name=twitter:description', description);

    let script = document.head.querySelector('script[data-seo-jsonld]');
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.dataset.seoJsonld = '';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, type, jsonLd]);
}
