import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './styles'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

const buttonVariants = {
  primary: 'bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary-ink',
  outline: 'border border-line bg-white text-muted hover:bg-paper hover:text-ink',
  ghost: 'text-muted hover:bg-paper hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-95',
} as const

const buttonSizes = {
  sm: 'px-3 py-2 text-[13px]',
  md: '',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
}

export function Button({ variant = 'outline', size = 'md', className, ...props }: ButtonProps) {
  return <button className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...props} />
}

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cx('flex flex-col', className)}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="text-xs text-faint">{hint}</span>}
      </span>
      {children}
    </label>
  )
}
