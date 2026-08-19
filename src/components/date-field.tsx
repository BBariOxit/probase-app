'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const readable = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * A date, with the date said back in words underneath.
 *
 * `<input type="date">` renders in the *browser's* locale, not the page's — an
 * office running Chrome in English sees `08/12/2026` for the twelfth of August
 * and reads it as the eighth of December. `lang="vi"` on the document does not
 * change that; nothing in the page can.
 *
 * Rather than replace the native control — which brings a calendar, a keyboard
 * model and a timezone bug of its own — the value is echoed underneath in
 * Vietnamese. The widget can say whatever its locale wants; the line below it is
 * unambiguous, and it is what somebody checks against before saving a
 * registration deadline.
 */
export function DateField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled = false,
  invalid = false,
  error,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  /** `yyyy-mm-dd`, which is what the native input speaks. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>}

      <Input
        id={id}
        type="date"
        className={className}
        value={value}
        disabled={disabled}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
      />

      {/*
        Parsed as a plain calendar day rather than through `new Date(value)`,
        which reads `yyyy-mm-dd` as UTC midnight and can render the day before
        for anybody east of Greenwich — which is everybody here.
      */}
      {value && <p className="text-xs text-muted-foreground">{spell(value)}</p>}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function spell(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return '';

  return readable.format(new Date(year, month - 1, day));
}
