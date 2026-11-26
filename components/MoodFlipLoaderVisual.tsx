export default function MoodFlipLoaderVisual() {
  return <div className="flex flex-col items-center justify-center">
    <div className="relative mb-6 flex items-center justify-center">
      <div className="absolute -inset-6 animate-pulse rounded-full bg-gradient-to-r from-[#7464AC]/20 via-[#EDAA7A]/25 to-[#E49C8C]/25 blur-2xl motion-reduce:animate-none" />
      <div className="relative h-20 w-20 animate-spin rounded-full bg-gradient-to-tr from-[#7464AC] via-[#EDAA7A] to-[#E49C8C] p-[3px] shadow-lg shadow-[#7464AC]/20 motion-reduce:animate-none sm:h-24 sm:w-24">
        <div className="h-full w-full rounded-full bg-[#FDF8F5]" />
      </div>
      <div className="absolute flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-gradient-to-tr from-[#E49C8C] to-[#EDAA7A] text-xl shadow-md shadow-[#EDAA7A]/30 motion-reduce:animate-none sm:h-14 sm:w-14 sm:text-2xl">
        <span className="select-none drop-shadow-sm">💕</span>
      </div>
    </div>
    <div className="space-y-2.5 text-center">
      <img src="/moodflip-logo.png" alt="MoodFlip" className="mx-auto h-8 w-auto object-contain mix-blend-multiply drop-shadow-xs sm:h-9" />
      <p className="flex items-center justify-center gap-2 text-xs font-semibold tracking-tight text-[#5C527A] sm:text-sm">
        <span>Preparing your mindset shift</span>
        <span className="inline-flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#7464AC] motion-reduce:animate-none" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#EDAA7A] motion-reduce:animate-none" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#E49C8C] motion-reduce:animate-none" style={{ animationDelay: '300ms' }} />
        </span>
      </p>
    </div>
  </div>;
}
