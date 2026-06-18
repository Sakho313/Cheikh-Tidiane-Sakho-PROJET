import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';

/**
 * Cyber-styled segmented access-code entry. Renders one neon cell per character
 * of `code`, auto-advances while typing, supports paste, and calls `onUnlock`
 * when the entered value matches `code` (case-insensitive). A wrong code shakes
 * and flashes red.
 */
export function AccessCodeGate({
  code,
  onUnlock,
  disabled = false,
}: {
  code: string;
  onUnlock: () => void;
  disabled?: boolean;
}) {
  const len = code.length;
  const [chars, setChars] = useState<string[]>(() => Array(len).fill(''));
  const [error, setError] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusCell = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(len - 1, i))];
    el?.focus();
    el?.select();
  };

  const validate = (value: string) => {
    if (value.toUpperCase() === code.toUpperCase()) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => {
        setChars(Array(len).fill(''));
        setError(false);
        focusCell(0);
      }, 650);
    }
  };

  const handleChange = (i: number, raw: string) => {
    if (disabled) return;
    // Keep only the last typed character (handles fast typing/overwrite).
    const ch = raw.slice(-1).toUpperCase();
    const next = [...chars];
    next[i] = ch;
    setChars(next);
    if (ch && i < len - 1) focusCell(i + 1);
    if (next.every((c) => c !== '')) validate(next.join(''));
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[i] && i > 0) {
      focusCell(i - 1);
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focusCell(i - 1);
    } else if (e.key === 'ArrowRight' && i < len - 1) {
      focusCell(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').trim().toUpperCase().slice(0, len);
    if (!text) return;
    const next = Array(len).fill('');
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setChars(next);
    focusCell(Math.min(text.length, len - 1));
    if (next.every((c) => c !== '')) validate(next.join(''));
  };

  return (
    <div className={error ? 'animate-sao-shake' : ''}>
      <div className="flex justify-center gap-2">
        {chars.map((c, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="text"
            maxLength={1}
            autoComplete="off"
            aria-label={`Caractère ${i + 1} du code d'accès`}
            value={c}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`h-12 w-10 rounded-lg border bg-slate-800/70 text-center text-lg font-bold uppercase
              text-teal-200 caret-teal-400 outline-none transition-all sm:w-11
              ${c ? 'animate-sao-cell-pop' : ''}
              ${
                error
                  ? 'border-red-500/70 text-red-300 shadow-[0_0_14px_2px_rgba(239,68,68,0.4)]'
                  : c
                    ? 'border-teal-400/80 shadow-[0_0_14px_2px_rgba(45,212,191,0.35)]'
                    : 'border-slate-600/70'
              }
              focus:border-teal-400 focus:shadow-[0_0_16px_3px_rgba(45,212,191,0.45)]
              disabled:cursor-not-allowed disabled:opacity-50`}
          />
        ))}
      </div>
      <p
        className={`mt-2 text-center text-[11px] transition-colors ${
          error ? 'font-semibold text-red-400' : 'text-slate-400'
        }`}
      >
        {error ? 'Code invalide — réessayez' : 'Saisissez le code fourni par SAO Consulting'}
      </p>
    </div>
  );
}
