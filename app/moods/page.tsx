import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Mood Guides and Practical Reflection Prompts | MoodFlip',
  description: 'Browse MoodFlip guides for difficult feelings, everyday setbacks and small practical actions. Find a relevant guide or learn how the tool works.',
  openGraph: {
    title: 'Mood Guides and Practical Reflection Prompts | MoodFlip',
    description: 'Browse MoodFlip guides for difficult feelings, everyday setbacks and small practical actions. Find a relevant guide or learn how the tool works.',
    url: 'https://moodflip.coach/moods',
  },
  alternates: {
    canonical: 'https://moodflip.coach/moods',
  },
};

const CATEGORIES = [
  {
    title: 'Sadness and disconnection',
    description: 'For times when you want company, feel flat or are struggling to see a way forward.',
    guides: [
      { name: 'Sad', slug: 'feeling-sad' },
      { name: 'Lonely', slug: 'feeling-lonely' },
      { name: 'Hopeless', slug: 'feeling-hopeless' },
      { name: 'Empty', slug: 'feeling-empty' },
      { name: 'Numb', slug: 'feeling-numb' },
    ],
  },
  {
    title: 'Worry and uncertainty',
    description: 'For a difficult decision, an upcoming event or a situation you cannot fully control.',
    guides: [
      { name: 'Anxious', slug: 'feeling-anxious' },
      { name: 'Fearful', slug: 'feeling-fearful' },
      { name: 'Nervous', slug: 'feeling-nervous' },
      { name: 'Insecure', slug: 'feeling-insecure' },
      { name: 'Lost', slug: 'feeling-lost' },
      { name: 'Confused', slug: 'feeling-confused' },
    ],
  },
  {
    title: 'Conflict and difficult interactions',
    description: 'For a blocked goal, a painful exchange or a response you want to think through.',
    guides: [
      { name: 'Angry', slug: 'feeling-angry' },
      { name: 'Frustrated', slug: 'feeling-frustrated' },
      { name: 'Irritated', slug: 'feeling-irritated' },
      { name: 'Disgusted', slug: 'feeling-disgusted' },
      { name: 'Jealous', slug: 'feeling-jealous' },
      { name: 'Rejected', slug: 'feeling-rejected' },
      { name: 'Guilty', slug: 'feeling-guilty' },
      { name: 'Ashamed', slug: 'feeling-ashamed' },
      { name: 'Disappointed', slug: 'feeling-disappointed' },
    ],
  },
  {
    title: 'Pressure and low energy',
    description: 'For too much to do, difficulty starting or a need to reduce demands.',
    guides: [
      { name: 'Overwhelmed', slug: 'feeling-overwhelmed' },
      { name: 'Stressed', slug: 'feeling-stressed' },
      { name: 'Tired', slug: 'feeling-tired' },
      { name: 'Exhausted', slug: 'feeling-exhausted' },
      { name: 'Unmotivated', slug: 'feeling-unmotivated' },
      { name: 'Bored', slug: 'feeling-bored' },
      { name: 'Restless', slug: 'feeling-restless' },
    ],
  },
  {
    title: 'Using MoodFlip',
    description: 'Choose a response, understand the tool or try a brief check-in.',
    guides: [
      { name: 'Lift your mood', slug: 'flip-your-mood' },
      { name: 'Mood shift technique', slug: 'mood-shift-technique' },
      { name: 'How to feel better', slug: 'how-to-feel-better' },
      { name: '60 second mood reset', slug: '60-second-mood-reset' },
    ],
  },
];

export default function MoodsIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Mood guides for everyday feelings',
    description: metadata.description,
    url: 'https://moodflip.coach/moods',
    isPartOf: { '@type': 'WebSite', name: 'MoodFlip', url: 'https://moodflip.coach' },
  };
  return (
    <div className="min-h-screen bg-[#FDF8F5] text-[#1A143F] font-sans antialiased flex flex-col justify-between selection:bg-[#F4EBF5] selection:text-[#7464AC]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-6">
        
        {/* Banner */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#E4DAD7] shadow-xs py-6 px-6 text-center bg-[#FDF8F5]">
          <img
            src="/peaceful-sunrise-bg.png"
            alt="MoodFlip Sunrise"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-40"
          />
          <div className="relative z-10 space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4F438B] tracking-tight">
              Mood guides for everyday feelings
            </h1>
            <p className="text-sm sm:text-base text-[#5C527A] max-w-2xl mx-auto leading-relaxed">
              Choose a guide that fits what is happening for you. Each offers a practical reflection, an everyday example and a possible next step. You do not need a perfect label, and you can leave any suggestion that does not suit your situation.
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {CATEGORIES.map((cat, idx) => (
            <section
              key={idx}
              className="rounded-2xl border border-[#E4DAD7] bg-[#FEFAF8] p-5 sm:p-6 shadow-[0_4px_24px_rgba(26,20,63,0.03)] space-y-3"
            >
              <div>
                <h2 className="text-lg font-bold text-[#4F438B] font-serif">
                  {cat.title}
                </h2>
                <p className="text-sm text-[#7464AC]/80">
                  {cat.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {cat.guides.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/moods/${g.slug}`}
                    className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-[#D6CEE8] bg-[#F8F3FA] text-[#4F438B] text-sm font-semibold hover:border-[#7464AC] hover:bg-[#EEE0FC] hover:shadow-xs transition"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Medical & Crisis Safety Disclaimer */}
        <div className="rounded-xl border border-[#E4DAD7]/70 bg-[#FAF7FD] p-4 text-xs text-[#7464AC] leading-relaxed">
          <p>
            MoodFlip offers general self-help prompts. It is not therapy or medical advice. If difficult feelings persist or affect daily life, seek professional support. If you cannot keep yourself safe, seek urgent help through local services.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
