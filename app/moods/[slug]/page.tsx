import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MOOD_PAGES, ALL_SLUGS } from '../seo_data';

export async function generateStaticParams() {
  return ALL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = MOOD_PAGES[slug];
  if (!page) return { title: 'MoodFlip | Mood Tool' };
  return {
    title: page.title,
    description: page.metaDesc,
    openGraph: {
      title: page.title,
      description: page.metaDesc,
      url: `https://moodflip.coach/moods/${slug}`,
    },
    alternates: {
      canonical: `https://moodflip.coach/moods/${slug}`,
    },
  };
}

export default async function MoodPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = MOOD_PAGES[slug];
  if (!page) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.heading,
    description: page.metaDesc,
    mainEntityOfPage: `https://moodflip.coach/moods/${slug}`,
    author: {
      '@type': 'Organization',
      name: 'MoodFlip Editorial Team',
      url: 'https://moodflip.coach',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MoodFlip',
      logo: {
        '@type': 'ImageObject',
        url: 'https://moodflip.coach/moodflip-logo.png',
      },
    },
    datePublished: '2026-10-25T00:00:00Z',
    dateModified: '2026-10-25T00:00:00Z',
  };

  return (
    <div className="min-h-screen bg-[#FDF8F5] text-[#1A143F] font-sans antialiased flex flex-col justify-between selection:bg-[#F4EBF5] selection:text-[#7464AC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-6">
        
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="text-xs sm:text-sm text-[#7464AC] flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="text-[#C4BADB]">›</span>
          <Link href="/moods" className="hover:underline">Mood Guides</Link>
          <span className="text-[#C4BADB]">›</span>
          <span className="text-[#5C527A] truncate">{page.heading}</span>
        </nav>

        {/* Article Container */}
        <article className="rounded-2xl sm:rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-6 sm:p-8 shadow-[0_4px_24px_rgba(26,20,63,0.03)] space-y-6">
          
          {/* Header */}
          <header className="space-y-2 border-b border-[#E4DAD7]/70 pb-4">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#4F438B] tracking-tight leading-snug">
              {page.heading}
            </h1>
            <p className="text-xs text-[#7464AC] font-medium">
              Editorial Guide · Updated October 2026 · 3 min read
            </p>
          </header>

          {/* Intro Paragraphs */}
          <div className="space-y-3 text-sm sm:text-base text-[#1A143F] leading-relaxed">
            {page.intro.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* Practical Check-in / Steps Box */}
          <section className="rounded-2xl border border-[#D6CEE8] bg-[#F8F3FA] p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B] font-serif">
              {page.exerciseTitle}
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-[#1A143F] leading-relaxed font-medium">
              {page.exerciseSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </section>

          {/* Everyday Example */}
          {page.exampleText && (
            <section className="rounded-2xl border border-[#E4DAD7] bg-[#FDF8F5] p-5 sm:p-6 space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-[#4F438B] font-serif">
                {page.exampleTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#5C527A] leading-relaxed">
                {page.exampleText}
              </p>
            </section>
          )}

          {/* Safety / When a small step is not enough */}
          {page.safetyText && (
            <section className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-5 sm:p-6 space-y-2 text-xs sm:text-sm text-[#5C527A] leading-relaxed">
              <h2 className="text-base sm:text-lg font-bold text-[#4F438B] font-serif">
                {page.safetyTitle}
              </h2>
              <p>{page.safetyText}</p>
            </section>
          )}

          {/* Interactive Tool Direction & CTA */}
          <section className="rounded-2xl border-2 border-[#7464AC]/30 bg-gradient-to-br from-[#F5EEFB] to-[#FDF8F5] p-6 text-center space-y-4 shadow-sm">
            <p className="text-sm sm:text-base text-[#1A143F] font-semibold max-w-xl mx-auto leading-relaxed">
              {page.toolDirection}
            </p>
            <div>
              <a
                href={page.toolLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] text-white font-extrabold text-sm sm:text-base shadow-md shadow-[#4F438B]/20 hover:scale-[1.02] hover:opacity-95 transition-all"
              >
                Lift My Mood →
              </a>
            </div>
          </section>

          {/* Related Guides */}
          {page.relatedGuides && page.relatedGuides.length > 0 && (
            <section className="pt-4 border-t border-[#E4DAD7]/70 space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#4F438B]">
                Related Guides
              </h2>
              <div className="flex flex-wrap gap-2">
                {page.relatedGuides.map((rg) => (
                  <Link
                    key={rg.slug}
                    href={`/moods/${rg.slug}`}
                    className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-[#D6CEE8] bg-[#FDF8F5] text-[#4F438B] text-xs sm:text-sm font-semibold hover:border-[#7464AC] hover:bg-[#EEE0FC] transition"
                  >
                    {rg.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Further Reading Citation (if present) */}
          {page.furtherReading && (
            <p className="text-xs text-[#7464AC] italic">
              Further reading: {page.furtherReading}
            </p>
          )}

          {/* Standard Medical & Crisis Disclaimer */}
          <footer className="pt-4 border-t border-[#E4DAD7]/70 text-xs text-[#7464AC] leading-relaxed">
            <p>
              MoodFlip offers general self-help prompts. It is not therapy or medical advice. If difficult feelings persist or affect daily life, seek professional support. If you cannot keep yourself safe, seek urgent help through local services.
            </p>
          </footer>

        </article>

      </main>

      <Footer />
    </div>
  );
}
