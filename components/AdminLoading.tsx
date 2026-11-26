import MoodFlipLoaderVisual from '@/components/MoodFlipLoaderVisual';

export default function AdminLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#FDF8F5] px-4">
    <div role="status" aria-label="Loading administration">
      <MoodFlipLoaderVisual />
    </div>
  </main>;
}
