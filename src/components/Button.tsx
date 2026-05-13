import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost'
  }
>

export function Button({ variant = 'primary', className, ...props }: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition duration-200 active:translate-y-[0.5px] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tf-bg)]'
  const styles =
    variant === 'primary'
      ? 'bg-[var(--tf-accent)] text-white shadow-sm hover:-translate-y-[0.5px] hover:bg-black/90 hover:shadow-md'
      : 'bg-transparent text-[var(--tf-ink)] hover:bg-black/5'

  return <button {...props} className={[base, styles, className].filter(Boolean).join(' ')} />
}
