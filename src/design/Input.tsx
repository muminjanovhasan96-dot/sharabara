import { forwardRef, useId } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import * as RSwitch from '@radix-ui/react-switch'
import * as RCheckbox from '@radix-ui/react-checkbox'
import * as RSlider from '@radix-ui/react-slider'
import { Check, ChevronDown, Minus, Plus, Search, X } from 'lucide-react'
import { cn, haptic } from '@/lib/utils'
import { groupDigits, parseSumInput } from '@/domain/money'
import type { Tiyin } from '@/domain/types'
import { uz } from '@/i18n/uz'

/* ─── shared ─────────────────────────────────────────────────────────── */
const fieldBase =
  'w-full rounded-[10px] border bg-card text-ink placeholder:text-ink-3 outline-none transition-colors ' +
  'text-[16px] md:text-[15px] ' +
  'focus:border-gold focus:ring-2 focus:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-50'
const borderOf = (invalid?: boolean) => (invalid ? 'border-brick focus:border-brick focus:ring-brick/25' : 'border-line hover:border-line-strong')

/* ─── Input ──────────────────────────────────────────────────────────── */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  invalid?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  wrapperClassName?: string
}
const H = { sm: 'h-9', md: 'h-11 min-h-[44px]', lg: 'h-13 min-h-[52px]' }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, leading, trailing, size = 'md', className, wrapperClassName, ...rest },
  ref,
) {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, borderOf(invalid), H[size], 'px-3', leading && 'pl-10', trailing && 'pr-10', className)}
      {...rest}
    />
  )
  if (!leading && !trailing) return input
  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      {leading && <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-ink-3 [&>svg]:h-[18px] [&>svg]:w-[18px]">{leading}</span>}
      {input}
      {trailing && <span className="absolute inset-y-0 right-2 inline-flex items-center text-ink-3">{trailing}</span>}
    </div>
  )
})

/* ─── Textarea ───────────────────────────────────────────────────────── */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { invalid?: boolean }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, className, rows = 3, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} aria-invalid={invalid || undefined} className={cn(fieldBase, borderOf(invalid), 'min-h-[44px] px-3 py-2.5 leading-snug', className)} {...rest} />
})

/* ─── Select (native) ────────────────────────────────────────────────── */
export interface SelectOption { value: string; label: string; disabled?: boolean }
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  invalid?: boolean
  options?: SelectOption[]
  placeholder?: string
  size?: 'sm' | 'md'
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, options, placeholder, size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(fieldBase, borderOf(invalid), H[size], 'appearance-none pl-3 pr-9', className)}
        {...rest}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options?.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        {children}
      </select>
      <ChevronDown size={16} strokeWidth={1.75} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
    </div>
  )
})

/* ─── NumberInput ────────────────────────────────────────────────────── */
export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'size'> {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  invalid?: boolean
  size?: 'sm' | 'md'
  decrementLabel?: string
  incrementLabel?: string
}
export function NumberInput({
  value, onChange, step = 1, min = -Infinity, max = Infinity, invalid, size = 'md', className, disabled,
  decrementLabel = '−', incrementLabel = '+', ...rest
}: NumberInputProps) {
  const clampV = (v: number) => Math.min(max, Math.max(min, v))
  const set = (v: number) => { if (!Number.isNaN(v)) { haptic(6); onChange(clampV(v)) } }
  const btn = cn(
    'inline-flex shrink-0 items-center justify-center text-ink-2 hover:bg-paper-2 disabled:opacity-40 disabled:hover:bg-transparent',
    size === 'sm' ? 'h-9 w-9' : 'h-11 w-11 min-h-[44px] min-w-[44px]',
  )
  return (
    <div className={cn('inline-flex items-stretch overflow-hidden rounded-[10px] border bg-card', borderOf(invalid), disabled && 'opacity-50', className)}>
      <button type="button" className={btn} aria-label={decrementLabel} onClick={() => set(value - step)} disabled={disabled || value - step < min}>
        <Minus size={16} strokeWidth={1.75} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => { const n = Number(e.target.value.replace(/[^\d.-]/g, '')); if (e.target.value === '' ) onChange(clampV(0)); else set(n) }}
        className={cn('tnum w-14 border-x border-line bg-transparent text-center text-[16px] md:text-[15px] outline-none', size === 'sm' && 'w-12')}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <button type="button" className={btn} aria-label={incrementLabel} onClick={() => set(value + step)} disabled={disabled || value + step > max}>
        <Plus size={16} strokeWidth={1.75} />
      </button>
    </div>
  )
}

/* ─── MoneyInput ─────────────────────────────────────────────────────── */
export interface MoneyInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'trailing'> {
  valueTiyin: Tiyin | null
  onChangeTiyin: (t: Tiyin | null) => void
  currency?: string
}
/** Groups so'm digits while typing; emits tiyin. */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { valueTiyin, onChangeTiyin, currency = uz.app.sum, className, ...rest },
  ref,
) {
  const text = valueTiyin === null ? '' : groupDigits(Math.trunc(valueTiyin / 100), ' ')
  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => onChangeTiyin(parseSumInput(e.target.value))}
      className={cn('tnum pr-14 text-right', className)}
      trailing={<span className="pr-1 text-[13px] text-ink-3">{currency}</span>}
      {...rest}
    />
  )
})

/* ─── SearchInput ────────────────────────────────────────────────────── */
export interface SearchInputProps extends Omit<InputProps, 'value' | 'onChange' | 'leading' | 'trailing'> {
  value: string
  onChange: (v: string) => void
  onClear?: () => void
  clearLabel?: string
}
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, onClear, clearLabel = uz.app.close, className, ...rest },
  ref,
) {
  return (
    <Input
      ref={ref}
      type="search"
      role="searchbox"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      leading={<Search strokeWidth={1.75} />}
      className={cn('rounded-full [&::-webkit-search-cancel-button]:hidden', className)}
      trailing={
        value ? (
          <button
            type="button"
            aria-label={clearLabel}
            onClick={() => { onChange(''); onClear?.() }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        ) : undefined
      }
      {...rest}
    />
  )
})

/* ─── Field ──────────────────────────────────────────────────────────── */
export interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  optionalText?: string
  htmlFor?: string
  className?: string
  children: ReactNode
  /** inline label row (switch/checkbox) */
  inline?: boolean
}
export function Field({ label, hint, error, required, optionalText, htmlFor, className, children, inline = false }: FieldProps) {
  const autoId = useId()
  const id = htmlFor ?? autoId
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className={cn('flex items-baseline gap-1 text-[13px] font-medium text-ink-2', inline && 'justify-between')}>
          <span>
            {label}
            {required && <span className="ml-0.5 text-brick" aria-hidden="true">*</span>}
          </span>
          {!required && optionalText && <span className="text-[11px] font-normal text-ink-3">{optionalText}</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-[12.5px] leading-snug text-brick">{error}</p>
      ) : hint ? (
        <p className="text-[12.5px] leading-snug text-ink-3">{hint}</p>
      ) : null}
    </div>
  )
}

/* ─── Switch ─────────────────────────────────────────────────────────── */
export interface SwitchProps extends RSwitch.SwitchProps { label?: ReactNode; size?: 'sm' | 'md' }
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ label, size = 'md', className, id, ...rest }, ref) {
  const autoId = useId()
  const sid = id ?? autoId
  const sw = (
    <RSwitch.Root
      ref={ref}
      id={sid}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-line-strong transition-colors',
        'data-[state=checked]:bg-green focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50',
        size === 'sm' ? 'h-5 w-9' : 'h-7 w-12',
        className,
      )}
      {...rest}
    >
      <RSwitch.Thumb
        className={cn(
          'block rounded-full bg-card shadow-soft transition-transform',
          size === 'sm' ? 'h-4 w-4 translate-x-0.5 data-[state=checked]:translate-x-[18px]' : 'h-6 w-6 translate-x-0.5 data-[state=checked]:translate-x-[22px]',
        )}
      />
    </RSwitch.Root>
  )
  if (!label) return sw
  return (
    <label htmlFor={sid} className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 text-[14px] text-ink">
      <span>{label}</span>
      {sw}
    </label>
  )
})

/* ─── Checkbox ───────────────────────────────────────────────────────── */
export interface CheckboxProps extends RCheckbox.CheckboxProps { label?: ReactNode; description?: ReactNode }
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox({ label, description, className, id, ...rest }, ref) {
  const autoId = useId()
  const cid = id ?? autoId
  const box = (
    <RCheckbox.Root
      ref={ref}
      id={cid}
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border border-line-strong bg-card text-paper transition-colors',
        'data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=indeterminate]:border-ink data-[state=indeterminate]:bg-ink',
        'focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      <RCheckbox.Indicator>
        {rest.checked === 'indeterminate' ? <Minus size={12} strokeWidth={2.5} /> : <Check size={13} strokeWidth={2.5} />}
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  )
  if (!label) return box
  return (
    <label htmlFor={cid} className="flex min-h-[44px] cursor-pointer items-start gap-2.5 py-2 text-[14px] text-ink">
      <span className="mt-0.5">{box}</span>
      <span className="min-w-0">
        <span className="block leading-snug">{label}</span>
        {description && <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">{description}</span>}
      </span>
    </label>
  )
})

/* ─── Chip / ChipGroup ───────────────────────────────────────────────── */
export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type' | 'value' | 'onToggle'> {
  selected?: boolean
  onToggle?: (next: boolean) => void
  icon?: ReactNode
  size?: 'sm' | 'md'
  children?: ReactNode
}
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip({ selected = false, onToggle, icon, size = 'md', className, children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => { haptic(6); onToggle?.(!selected) }}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 min-h-[40px] px-3.5 text-[14px]',
        selected ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink hover:border-line-strong',
        className,
      )}
      {...rest}
    >
      {icon && <span className="inline-flex [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      {children}
    </button>
  )
})

export interface ChipOption<V extends string = string> { value: V; label: ReactNode; icon?: ReactNode; disabled?: boolean }
export type ChipGroupProps<V extends string = string> =
  | { mode?: 'single'; options: ChipOption<V>[]; value: V | null; onChange: (v: V | null) => void; allowEmpty?: boolean; size?: 'sm' | 'md'; className?: string; 'aria-label'?: string }
  | { mode: 'multi'; options: ChipOption<V>[]; value: V[]; onChange: (v: V[]) => void; allowEmpty?: boolean; size?: 'sm' | 'md'; className?: string; 'aria-label'?: string }

export function ChipGroup<V extends string = string>(props: ChipGroupProps<V>) {
  const { options, size = 'md', className, allowEmpty = true } = props
  const isSel = (v: V) => (props.mode === 'multi' ? props.value.includes(v) : props.value === v)
  const toggle = (v: V) => {
    if (props.mode === 'multi') {
      const has = props.value.includes(v)
      const next = has ? props.value.filter((x) => x !== v) : [...props.value, v]
      if (!allowEmpty && next.length === 0) return
      props.onChange(next)
    } else {
      if (props.value === v) { if (allowEmpty) props.onChange(null) } else props.onChange(v)
    }
  }
  return (
    <div role="group" aria-label={props['aria-label']} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => (
        <Chip key={o.value} size={size} icon={o.icon} selected={isSel(o.value)} disabled={o.disabled} onToggle={() => toggle(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  )
}

/* ─── RangeSlider ────────────────────────────────────────────────────── */
export interface RangeSliderProps {
  value: [number, number]
  onValueChange: (v: [number, number]) => void
  onValueCommit?: (v: [number, number]) => void
  min: number
  max: number
  step?: number
  format?: (v: number) => string
  minStepsBetweenThumbs?: number
  className?: string
  'aria-label'?: string
  disabled?: boolean
}
/** Two-thumb Radix slider that renders the current values. */
export function RangeSlider({ value, onValueChange, onValueCommit, min, max, step = 1, format = (v) => groupDigits(v), minStepsBetweenThumbs = 1, className, disabled, ...rest }: RangeSliderProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="tnum flex items-center justify-between text-[13px] font-medium text-ink">
        <span>{format(value[0])}</span>
        <span>{format(value[1])}</span>
      </div>
      <RSlider.Root
        value={value}
        onValueChange={(v) => onValueChange([v[0], v[1]])}
        onValueCommit={(v) => onValueCommit?.([v[0], v[1]])}
        min={min} max={max} step={step}
        minStepsBetweenThumbs={minStepsBetweenThumbs}
        disabled={disabled}
        className={cn('relative flex h-11 w-full touch-none select-none items-center', disabled && 'opacity-50')}
        aria-label={rest['aria-label']}
      >
        <RSlider.Track className="relative h-1.5 w-full grow rounded-full bg-paper-2">
          <RSlider.Range className="absolute h-full rounded-full bg-gold" />
        </RSlider.Track>
        {[0, 1].map((i) => (
          <RSlider.Thumb
            key={i}
            className="block h-6 w-6 rounded-full border-[1.5px] border-ink bg-card shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
        ))}
      </RSlider.Root>
    </div>
  )
}
