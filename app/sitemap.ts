import { MetadataRoute } from 'next';
import { ALL_SLUGS } from './moods/seo_data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://moodflip.coach';

  // Core pages
  const staticPages = [
    { url: baseUrl, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/moods`, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/login`, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/register`, changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  // 31 SEO Mood Guides
  const moodPages = ALL_SLUGS.map((slug) => ({
    url: `${baseUrl}/moods/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...moodPages];
}
