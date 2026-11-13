/**
 * SEO Foundation Utility Module
 * Project: TOMSHOPBD
 */

import { SEOProps } from '../types';

export function updateMetaTags(props: SEOProps) {
  const defaultTitle = 'TOMSHOPBD - Enterprise E-Commerce & Delivery Platform';
  const defaultDesc = 'TOMSHOPBD: বাংলাদেশের নির্ভরযোগ্য অনলাইন শপিং, ই-কমার্স, এমএলএম ও বিশ্বস্ত স্থানীয় হোম ডেলিভারি প্ল্যাটফর্ম।';

  const title = props.title ? `${props.title} | TOMSHOPBD` : defaultTitle;
  const description = props.description || defaultDesc;
  const canonical = props.canonicalUrl || window.location.href;

  // Document Title
  document.title = title;

  // Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);

  // OpenGraph Tags
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:url', canonical);
  if (props.image) {
    setMetaTag('property', 'og:image', props.image);
  }

  // Twitter Tags
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  if (props.image) {
    setMetaTag('name', 'twitter:image', props.image);
  }

  // Canonical Link
  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.setAttribute('href', canonical);

  // Schema.org JSON-LD
  injectSchemaJsonLd((props.schemaType as any) || 'Organization');
}

function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function injectSchemaJsonLd(type: 'Organization' | 'LocalBusiness' | 'WebSite') {
  let script = document.getElementById('schema-jsonld') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'schema-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': type,
    name: 'TOMSHOPBD',
    url: window.location.origin,
    logo: `${window.location.origin}/logo.png`,
    description: 'TOMSHOPBD Enterprise E-commerce, Network Marketing and Local Delivery Platform in Bangladesh',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dhaka',
      addressRegion: 'Dhaka Division',
      addressCountry: 'BD'
    },
    currenciesAccepted: 'BDT',
    openingHours: 'Mo-Su 00:00-24:00',
    telephone: '+8801700000000'
  };

  script.textContent = JSON.stringify(schemaData, null, 2);
}

export function generateRobotsTxt(): string {
  return `# robots.txt for TOMSHOPBD
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /super-admin/
Disallow: /api/
Sitemap: ${window.location.origin}/sitemap.xml
`;
}

export function generateSitemapXml(): string {
  const baseUrl = window.location.origin;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/profile</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
}
