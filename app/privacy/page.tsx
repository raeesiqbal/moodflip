import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms & Privacy Policy | MoodFlip',
  description: 'MoodFlip respects your privacy. This Terms & Privacy Policy explains what information we may collect and how it is used.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-[#FDF8F5] text-[#1A143F] font-sans antialiased flex flex-col justify-between selection:bg-[#F4EBF5] selection:text-[#7464AC]">
      <Header />

      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto px-4 sm:px-6 py-2 sm:py-3 w-full">
        {/* ── BANNER (Compact, zero blah-blah per Spec §23) ── */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#E4DAD7] shadow-xs h-[52px] sm:h-[60px] flex items-center justify-center text-center px-4 bg-[#FDF8F5] shrink-0 mb-2">
          <img
            src="/peaceful-sunrise-bg.png"
            alt="MoodFlip Peaceful Sunrise"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-80"
          />
          <div className="relative z-10">
            <h1 className="font-serif text-xl sm:text-2xl font-extrabold text-[#4F438B] tracking-tight">
              Terms &amp; Privacy Policy
            </h1>
          </div>
        </div>

        {/* ── MAIN CONTENT — with dedicated inner scroll container to satisfy no-window-scroll requirement ── */}
        <div className="flex-1 overflow-y-auto rounded-2xl sm:rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-5 sm:p-6 shadow-[0_4px_24px_rgba(26,20,63,0.04)] text-[#1A143F] space-y-4">
          
          {/* Section 1 */}
          <section className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B]">
              1. Using MoodFlip without a profile
            </h2>
            <div className="space-y-1 text-xs sm:text-sm text-[#1A143F] leading-relaxed pl-1">
              <p>You can use the basic MoodFlip tool without creating a profile.</p>
              <p>If you do not create a profile, MoodFlip does not need to store your e-mail address or saved mood history.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B]">
              2. Information we may collect
            </h2>
            <div className="space-y-1.5 text-xs sm:text-sm text-[#1A143F] leading-relaxed pl-1">
              <p>If you create a profile, MoodFlip may store:</p>
              <ul className="space-y-1 pl-5 list-disc text-[#1A143F] font-medium">
                <li>your e-mail address</li>
                <li>selected moods and feelings</li>
                <li>last activity dates</li>
                <li>actions shown to you</li>
                <li>purchase history for paid downloads</li>
              </ul>
              <p className="pt-1 text-[#1A143F]">
                This information is used to provide saved Mood Lifts, personalised downloads, and relevant MoodFlip offers.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B]">
              3. Paid downloads
            </h2>
            <div className="space-y-1 text-xs sm:text-sm text-[#1A143F] leading-relaxed pl-1">
              <p>If you purchase a MoodFlip PDF document, payment is processed through a secure third-party payment provider. MoodFlip does not store your card details.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B]">
              4. 90-day automatic deletion
            </h2>
            <div className="space-y-1 text-xs sm:text-sm text-[#1A143F] leading-relaxed pl-1">
              <p>Inactive profiles and saved mood history are automatically deleted after 90 days.</p>
              <p>Some purchase or transaction information may need to be retained for accounting and tax record-keeping purposes.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B]">
              5. Email messages
            </h2>
            <div className="space-y-1 text-xs sm:text-sm text-[#1A143F] leading-relaxed pl-1">
              <p>By creating a profile, you may receive e-mails related to your saved Mood Lifts, paid downloads or account activity.</p>
              <p>If you choose to receive MoodFlip offers or promotional e-mails, you can unsubscribe from these at any time using the unsubscribe link in the e-mail.</p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B]">
              6. Third-party services
            </h2>
            <div className="space-y-1 text-xs sm:text-sm text-[#1A143F] leading-relaxed pl-1">
              <p>MoodFlip uses third-party services to operate the website, securely store information and process payments. These service providers may process limited information necessary to provide their services.</p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B]">
              7. Your information
            </h2>
            <div className="space-y-1 text-xs sm:text-sm text-[#1A143F] leading-relaxed pl-1">
              <p>You can change your e-mail address or password, reset a forgotten password, and permanently delete your profile and saved information directly from Account Settings.</p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-1 pb-1">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B]">
              8. Not medical or crisis support
            </h2>
            <div className="space-y-1 text-xs sm:text-sm text-[#1A143F] leading-relaxed pl-1">
              <p>MoodFlip is a self-help tool. It is not therapy, medical advice, diagnosis, treatment, or crisis support.</p>
              <p>If you feel unsafe or need urgent help, please contact emergency services or a crisis support service in your country.</p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="space-y-1 pb-1">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B]">
              9. PDF delivery and retention
            </h2>
            <div className="space-y-1 text-xs sm:text-sm text-[#1A143F] leading-relaxed pl-1">
              <p>
                Please download and save your personalised PDF report. MoodFlip deletes its copies of report-delivery e-mails and attachments after 30 days. This does not affect copies already received or saved by you. Repeat downloads are not available. If your original delivery fails, contact{' '}
                <a href="mailto:contact@moodflip.coach" className="text-[#7464AC] underline hover:text-[#4F438B]">contact@moodflip.coach</a>{' '}
                so we can resolve it without charging you again.
              </p>
            </div>
          </section>

          <section className="space-y-1 pb-1">
            <h2 className="text-base sm:text-lg font-bold text-[#4F438B]">10. Optional analytics</h2>
            <div className="space-y-1 text-xs sm:text-sm text-[#1A143F] leading-relaxed pl-1">
              <p>With your permission, MoodFlip uses Google Analytics to measure broad website visits and actions such as account registration, sign-in, use of the free tool and purchases. MoodFlip does not intentionally send your selected moods, feelings, profile details or report contents to Google Analytics.</p>
              <p>Analytics is optional. Choose “Essential only” to use the site without it, or change your choice using “Analytics choices” in the footer. Individual mood guide visits are not measured so the guides you read are not disclosed through page tracking.</p>
            </div>
          </section>

          <p className="text-xs italic text-[#7464AC] pt-2 border-t border-[#E4DAD7]/60">
            Last updated: 27 November 2026
          </p>

        </div>
      </main>

      <Footer />
    </div>
  );
}
