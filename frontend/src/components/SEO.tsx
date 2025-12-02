import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  structuredData?: object;
}

const defaultTitle = 'APIVault - Secure API Key Management for Developers';
const defaultDescription = 'Store, rotate, and share API keys securely. Never commit secrets to GitHub again. Built for indie developers and teams.';
const defaultImage = 'https://www.apivault.it.com/og-image.png';
const siteUrl = 'https://www.apivault.it.com';

export function SEO({
  title,
  description = defaultDescription,
  keywords = 'API key management, secrets management, secure API keys, key vault, secrets manager, environment variables, API security, developer tools',
  image = defaultImage,
  url,
  type = 'website',
  noindex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title ? `${title} | APIVault` : defaultTitle;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper function to update or create meta tag
    const setMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('author', 'APIVault');
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Google Search Console Verification - Always preserve this
    setMetaTag('google-site-verification', 'KFZTa0YprQ7LyAWe3ykYC4XnrZUY_XvaPTUdZCiMJG0');

    // Open Graph tags
    setMetaTag('og:title', fullTitle, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:image', image, 'property');
    setMetaTag('og:url', fullUrl, 'property');
    setMetaTag('og:type', type, 'property');
    setMetaTag('og:site_name', 'APIVault', 'property');

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);
    setMetaTag('twitter:site', '@apivault');

    // Robots
    setMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Structured Data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [fullTitle, description, keywords, image, fullUrl, type, noindex, structuredData]);

  return null;
}

// Helper function to generate Organization structured data
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'APIVault',
    url: siteUrl,
    logo: `${siteUrl}/Vector4x.png`,
    description: defaultDescription,
    sameAs: [
      // Add social media links when available
      // 'https://twitter.com/apivault',
      // 'https://github.com/apivault',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@apivault.it.com',
      contactType: 'Customer Service',
    },
  };
}

// Helper function to generate SoftwareApplication structured data
export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'APIVault',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web, CLI',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1',
    },
    description: defaultDescription,
    url: siteUrl,
  };
}

// Helper function to generate FAQPage structured data
export function getFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Helper function to generate BreadcrumbList structured data
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}

