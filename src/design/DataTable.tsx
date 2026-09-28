import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronLeft, ChevronRight, Columns3, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { Checkbox } from './Input'
import { SkeletonRows } from './Skeleton'
import { EmptyState } from './EmptyState'

export type SortDir = 'asc' | 'desc'
export interface SortState { key: string; dir: SortDir }

export interface Column<T> {
  key: string
  header: ReactNode
  width?: number | string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  render?: (row: T) => ReactNode
  /** value for CSV; default = raw field or rendered string */
  csv?: (row: T) => string | number | null | undefined
  /** value for sorting; default = raw field */
  sortValue?: (row: T) => string | number | null | undefined
  /** can be hidden via the columns menu (default true) */
  hideable?: boolean
  /** hidden by default (shown via the columns menu) — jadvalda standart 5–6 ta muhim ustun qoladi */
  defaultHidden?: boolean
  /** header text for CSV when `header` is not a string */
  csvHeader?: string
}

export interface DataTableLabels {
  columns: string
  export: string
  empty: string
  prev: string
  next: string
  selectAll: string
  selectRow: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  selectable?: boolean
  selected?: string[]
  onSelectionChange?: (keys: string[]) => void
  /** controlled sort */
  sort?: SortState | null
  onSortChange?: (s: SortState | null) => void
  defaultSort?: SortState | null
  pageSize?: number
  page?: number
  onPageChange?: (page: number) => void
  toolbarLeft?: ReactNode
  toolbarRight?: ReactNode
  emptyState?: ReactNode
  loading?: boolean
  skeletonRows?: number
  /** show columns visibility menu + CSV export button (default true) */
  columnsMenu?: boolean
  exportFilename?: string
  /** hidden column keys (uncontrolled if omitted) */
  hiddenColumns?: string[]
  onHiddenColumnsChange?: (keys: string[]) => void
  labels?: Partial<DataTableLabels>
  className?: string
  /** row-level class */
  rowClassName?: (row: T) => string | undefined
  /** sticky header offset container height; default max-h none */
  maxHeight?: number | string
}

const DEFAULT_LABELS: DataTableLabels = {
  columns: uz.admin.columns,
  export: uz.admin.export,
  empty: uz.app.empty,
  prev: uz.app.back,
  next: uz.app.next,
  selectAll: uz.app.all,
  selectRow: uz.app.yes,
}

function raw<T>(row: T, key: string): unknown {
  return (row as unknown as Record<string, unknown>)[key]
}

function toCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') return String(v)
  if (v instanceof Date) return v.toISOString()
  return String(v)
}

/** Build CSV text (UTF-8, semicolon-free, RFC 4180 quoting). */
export function buildCsv<T>(columns: Column<T>[], rows: T[]): string {
  const esc = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const head = columns.map((c) => esc(c.csvHeader ?? (typeof c.header === 'string' ? c.header : c.key)))
  const lines = rows.map((r) =>
    columns.map((c) => esc(toCell(c.csv ? c.csv(r) : raw(r, c.key)))).join(','),
  )
  return [head.join(','), ...lines].join('\r\n')
}

/** Trigger a CSV download with UTF-8 BOM (Excel-friendly). */
export function exportCsv<T>(filename: string, columns: Column<T>[], rows: T[]): void {
  const csv = '﻿' + buildCsv(columns, rows)
  if (typeof document === 'undefined') return
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'uz', { numeric: true })
}

export function sortRows<T>(rows: T[], columns: Column<T>[], sort: SortState | null | undefined): T[] {
  if (!sort) return rows
  const col = columns.find((c) => c.key === sort.key)
  if (!col) return rows
  const get = (r: T) => (col.sortValue ? col.sortValue(r) : raw(r, col.key))
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((x, y) => compare(get(x), get(y)) * dir)
}

/** Generic admin data table: sort, select, paginate, column menu, CSV, keyboard nav. */
export function DataTable<T>({
  columns, rows, rowKey, onRowClick, selectable = false, selected, onSelectionChange,
  sort, onSortChange, defaultSort = null, pageSize = 25, page, onPageChange,
  toolbarLeft, toolbarRight, emptyState, loading = false, skeletonRows = 8, columnsMenu = true, exportFilename = 'export',
  hiddenColumns, onHiddenColumnsChange, labels, className, rowClassName, maxHeight,
}: DataTableProps<T>) {
  const L = { ...DEFAULT_LABELS, ...labels }
  const [innerSort, setInnerSort] = useState<SortState | null>(defaultSort)
  const curSort = sort !== undefined ? sort : innerSort
  const setSort = (s: SortState | null) => { setInnerSort(s); onSortChange?.(s) }

  const [innerPage, setInnerPage] = useState(0)
  const curPage = page ?? innerPage
  const setPage = (p: number) => { setInnerPage(p); onPageChange?.(p) }

  const [innerHidden, setInnerHidden] = useState<string[]>(() => columns.filter((c) => c.defaultHidden).map((c) => c.key))
  const hidden = hiddenColumns ?? innerHidden
  const setHidden = (h: string[]) => { setInnerHidden(h); onHiddenColumnsChange?.(h) }

  const [innerSel, setInnerSel] = useState<string[]>([])
  const sel = selected ?? innerSel
  const setSel = (s: string[]) => { setInnerSel(s); onSelectionChange?.(s) }

  const visibleCols = columns.filter((c) => !hidden.includes(c.key))
  const sorted = useMemo(() => sortRows(rows, columns, curSort), [rows, columns, curSort])
  const total = sorted.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(curPage, pages - 1)
  const start = safePage * pageSize
  const pageRows = sorted.slice(start, start + pageSize)

  const pageKeys = pageRows.map(rowKey)
  const allSelected = pageKeys.length > 0 && pageKeys.every((k) => sel.includes(k))
  const someSelected = pageKeys.some((k) => sel.includes(k))
  const toggleAll = () => setSel(allSelected ? sel.filter((k) => !pageKeys.includes(k)) : Array.from(new Set([...sel, ...pageKeys])))
  const toggleOne = (k: string) => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k])

  const [focusIdx, setFocusIdx] = useState(-1)
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!pageRows.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx((i) => Math.min(pageRows.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter' && focusIdx >= 0) { e.preventDefault(); onRowClick?.(pageRows[focusIdx]) }
    else if (e.key === ' ' && focusIdx >= 0 && selectable) { e.preventDefault(); toggleOne(rowKey(pageRows[focusIdx])) }
  }
  useEffect(() => {
    if (focusIdx < 0) return
    const el = bodyRef.current?.querySelector<HTMLElement>(`[data-row-index="${focusIdx}"]`)
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' })
  }, [focusIdx])

  const clickSort = (c: Column<T>) => {
    if (!c.sortable) return
    if (!curSort || curSort.key !== c.key) setSort({ key: c.key, dir: 'asc' })
    else if (curSort.dir === 'asc') setSort({ key: c.key, dir: 'desc' })
    else setSort(null)
  }

  const alignCls = (a?: Column<T>['align']) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left')
  const hasToolbar = toolbarLeft || toolbarRight || columnsMenu

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-card border border-line bg-card text-ink', className)}>
      {hasToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">{toolbarLeft}</div>
          <div className="flex items-center gap-1">
            {toolbarRight}
            {columnsMenu && (
              <>
                <button
                  type="button"
                  onClick={() => exportCsv(exportFilename, visibleCols, sorted)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-card px-2.5 text-[13px] font-medium text-ink-2 hover:bg-paper-2"
                >
                  <Download size={15} strokeWidth={1.75} aria-hidden="true" /> {L.export}
                </button>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-card px-2.5 text-[13px] font-medium text-ink-2 hover:bg-paper-2"
                    >
                      <Columns3 size={15} strokeWidth={1.75} aria-hidden="true" /> {L.columns}
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={6}
                      className="z-50 min-w-[200px] rounded-[12px] border border-line bg-card p-1 text-ink shadow-soft"
                    >
                      {columns.filter((c) => c.hideable !== false).map((c) => {
                        const on = !hidden.includes(c.key)
                        return (
                          <DropdownMenu.CheckboxItem
                            key={c.key}
                            checked={on}
                            onCheckedChange={(v) => setHidden(v ? hidden.filter((k) => k !== c.key) : [...hidden, c.key])}
                            className="flex h-9 cursor-pointer select-none items-center gap-2 rounded-[8px] px-2 text-[13px] outline-none data-[highlighted]:bg-paper-2"
                          >
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-[4px] border border-line-strong">
                              <DropdownMenu.ItemIndicator><Check size={12} strokeWidth={2.5} /></DropdownMenu.ItemIndicator>
                            </span>
                            {typeof c.header === 'string' ? c.header : c.csvHeader ?? c.key}
                          </DropdownMenu.CheckboxItem>
                        )
                      })}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </>
            )}
          </div>
        </div>
      )}

      <div
        className="scroll-thin relative min-h-0 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-inset"
        style={{ maxHeight }}
        tabIndex={0}
        onKeyDown={onKey}
        aria-busy={loading || undefined}
      >
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--line)]">
            <tr>
              {selectable && (
                <th scope="col" className="w-10 px-3 py-0 text-left" style={{ height: 40 }}>
                  <Checkbox
                    aria-label={L.selectAll}
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    className="h-4 w-4 rounded-[4px]"
                  />
                </th>
              )}
              {visibleCols.map((c) => {
                const active = curSort?.key === c.key
                return (
                  <th
                    key={c.key}
                    scope="col"
                    style={{ width: c.width, height: 40 }}
                    aria-sort={active ? (curSort?.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn('eyebrow whitespace-nowrap px-3 py-0 font-semibold', alignCls(c.align), c.key === visibleCols[0]?.key && !selectable && 'sticky left-0 z-[2] bg-card')}
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => clickSort(c)}
                        className={cn('inline-flex h-8 items-center gap-1 rounded-[6px] hover:text-ink', active && 'text-ink', c.align === 'right' && 'flex-row-reverse')}
                      >
                        {c.header}
                        {active ? (
                          curSort?.dir === 'asc' ? <ArrowUp size={12} strokeWidth={2} /> : <ArrowDown size={12} strokeWidth={2} />
                        ) : (
                          <ArrowUpDown size={12} strokeWidth={1.75} className="opacity-50" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {!loading && pageRows.map((r, i) => {
              const k = rowKey(r)
              const isSel = sel.includes(k)
              const focused = i === focusIdx
              return (
                <tr
                  key={k}
                  data-row-index={i}
                  aria-selected={selectable ? isSel : undefined}
                  onClick={() => { setFocusIdx(i); onRowClick?.(r) }}
                  className={cn(
                    'border-t border-line transition-colors hover:bg-paper-2',
                    onRowClick && 'cursor-pointer',
                    isSel && 'bg-gold-fill/15',
                    focused && 'bg-paper-2 shadow-[inset_2px_0_0_var(--gold)]',
                    rowClassName?.(r),
                  )}
                  style={{ height: 40 }}
                >
                  {selectable && (
                    <td className="px-3 py-0" onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label={L.selectRow} checked={isSel} onCheckedChange={() => toggleOne(k)} className="h-4 w-4 rounded-[4px]" />
                    </td>
                  )}
                  {visibleCols.map((c) => (
                    <td key={c.key} className={cn('truncate px-3 py-0 align-middle', alignCls(c.align), c.key === visibleCols[0]?.key && !selectable && 'sticky left-0 z-[1] bg-card')} style={{ maxWidth: c.width }}>
                      {c.render ? c.render(r) : toCell(raw(r, c.key))}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
        {loading && <SkeletonRows rows={skeletonRows} cols={visibleCols.length + (selectable ? 1 : 0)} />}
        {!loading && total === 0 && (emptyState ?? <EmptyState compact title={L.empty} />)}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2 text-[12.5px] text-ink-2">
        <span className="tnum">
          {selectable && sel.length > 0 && <span className="mr-3 font-medium text-ink">{sel.length} ✓</span>}
          {total === 0 ? '0' : `${start + 1}–${Math.min(start + pageSize, total)}`} / {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={L.prev}
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] hover:bg-paper-2 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          <span className="tnum min-w-[3ch] text-center">{safePage + 1} / {pages}</span>
          <button
            type="button"
            aria-label={L.next}
            disabled={safePage >= pages - 1}
            onClick={() => setPage(safePage + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] hover:bg-paper-2 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  )
}
