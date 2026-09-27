import { createContext, useContext, useId, useState } from 'react'
import type { ReactNode } from 'react'
import * as RTabs from '@radix-ui/react-tabs'
import { motion, useReducedMotion } from 'framer-motion'
import { cn, SPRING } from '@/lib/utils'

export type TabsVariant = 'underline' | 'segmented'

interface Ctx { value: string; variant: TabsVariant; id: string; size: 'sm' | 'md' }
const TabsCtx = createContext<Ctx | null>(null)

export interface TabsProps extends Omit<RTabs.TabsProps, 'value' | 'defaultValue' | 'onValueChange'> {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  variant?: TabsVariant
  size?: 'sm' | 'md'
}

/** Radix Tabs styled: `underline` (animated gold underline) or `segmented` (pill). */
export function Tabs({ value, defaultValue, onValueChange, variant = 'underline', size = 'md', children, ...rest }: TabsProps) {
  const [inner, setInner] = useState(defaultValue ?? '')
  const current = value ?? inner
  const id = useId()
  const change = (v: string) => { setInner(v); onValueChange?.(v) }
  return (
    <TabsCtx.Provider value={{ value: current, variant, id, size }}>
      <RTabs.Root value={current} onValueChange={change} {...rest}>
        {children}
      </RTabs.Root>
    </TabsCtx.Provider>
  )
}

export interface TabsListProps extends RTabs.TabsListProps { fullWidth?: boolean }

export function TabsList({ className, fullWidth = false, ...rest }: TabsListProps) {
  const ctx = useContext(TabsCtx)
  const seg = ctx?.variant === 'segmented'
  return (
    <RTabs.List
      className={cn(
        'relative flex items-stretch',
        seg ? 'gap-0.5 rounded-[12px] border border-line bg-paper-2 p-0.5' : 'gap-1 border-b border-line',
        fullWidth ? 'w-full [&>*]:flex-1' : 'w-max max-w-full overflow-x-auto no-scrollbar',
        className,
      )}
      {...rest}
    />
  )
}

export interface TabsTriggerProps extends RTabs.TabsTriggerProps {
  icon?: ReactNode
  /** count badge */
  count?: number | string
}

export function TabsTrigger({ value, className, children, icon, count, ...rest }: TabsTriggerProps) {
  const ctx = useContext(TabsCtx)
  const reduce = useReducedMotion()
  const active = ctx?.value === value
  const seg = ctx?.variant === 'segmented'
  const sm = ctx?.size === 'sm'
  return (
    <RTabs.Trigger
      value={value}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-gold',
        seg
          ? cn('rounded-[10px] px-3', sm ? 'h-8 text-[13px]' : 'h-10 min-h-[40px] text-[14px]', active ? 'text-ink' : 'text-ink-2 hover:text-ink')
          : cn('px-3', sm ? 'h-9 text-[13px]' : 'h-11 min-h-[44px] text-[14px]', active ? 'text-ink' : 'text-ink-2 hover:text-ink'),
        className,
      )}
      {...rest}
    >
      {seg && active && (
        <motion.span
          layoutId={`${ctx?.id}-seg`}
          className="absolute inset-0 rounded-[10px] bg-card shadow-soft"
          transition={reduce ? { duration: 0 } : SPRING}
          aria-hidden="true"
        />
      )}
      <span className="relative inline-flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4">
        {icon}
        {children}
        {count !== undefined && (
          <span className={cn('tnum rounded-full px-1.5 text-[11px] leading-[18px]', active ? 'bg-gold-fill/40 text-ink' : 'bg-paper-2 text-ink-2')}>{count}</span>
        )}
      </span>
      {!seg && active && (
        <motion.span
          layoutId={`${ctx?.id}-underline`}
          className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-gold"
          transition={reduce ? { duration: 0 } : SPRING}
          aria-hidden="true"
        />
      )}
    </RTabs.Trigger>
  )
}

export function TabsContent({ className, ...rest }: RTabs.TabsContentProps) {
  return <RTabs.Content className={cn('outline-none', className)} {...rest} />
}
