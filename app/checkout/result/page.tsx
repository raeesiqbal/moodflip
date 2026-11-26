import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PaymentResult from '@/components/PaymentResult';

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[]; returned?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawOrder = typeof params.order === 'string' ? params.order : '';
  const order = /^MF7-[0-9]{8}-[A-Z0-9]{12}$/.test(rawOrder) ? rawOrder : null;

  return (
    <div className="min-h-screen bg-[#FDF8F5] text-[#1A143F] flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <section className="w-full max-w-lg rounded-3xl border border-[#E4DAD7] bg-[#FEFAF8] p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#F1EBFA] text-2xl" aria-hidden="true">
            ⏳
          </div>
          <PaymentResult order={order} returnedBack={params.returned === 'back'} />
          <Link
            href="/profile?tab=My%207-Day%20Report"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7464AC] to-[#4F438B] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            Return to My 7-Day Report
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
