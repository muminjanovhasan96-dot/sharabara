import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** e.g. ["⌘", "K"] or "G then O" — pass keys array for separate chips */
  keys?: string[]
}

/** Keyboard hint chip for admin shortcuts. */
export function Kbd({ keys, className, children, ...rest }: KbdProps) {
  const list = keys ?? (typeof children === 'string' ? [children] : null)
  if (!list) {
    return (
      <kbd className={cn(kbdClass, className)} {...rest}>{children}</kbd>
    )
  }
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {list.map((k, i) => (
        <kbd key={i} className={kbdClass} {...rest}>{k}</kbd>
      ))}
    </span>
  )
}

const kbdClass =
  'inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong bg-paper-2 px-1.5 ' +
  'font-body text-[11px] font-medium leading-none text-ink-2 shadow-[inset_0_-1px_0_var(--line-strong)]'
