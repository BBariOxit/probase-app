import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';

/** One centred column. Both auth screens are a single card and nothing else. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Brand />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
