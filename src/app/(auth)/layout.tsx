import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';

/** One centred column. Both auth screens are a single card and nothing else. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // flex-1, not min-h-full: body is itself sized by min-height, so a
    // percentage height here has nothing definite to resolve against and the
    // block collapses to its content — which is why the card used to sit at
    // the top instead of centring.
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Brand />
        <ThemeToggle />
      </header>

      {/* The header is already 60-odd pixels of visual weight at the top, so
          the card is pulled up slightly to sit optically centred rather than
          mathematically centred in the leftover space. */}
      <main className="flex flex-1 items-center justify-center px-5 pb-24 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
