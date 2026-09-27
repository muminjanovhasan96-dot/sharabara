import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { formatMoney } from '@/domain/money'
import { Button, DataTable, Ledger, LedgerRow, Money, Seal, Stamp, Badge, Illustration, buildCsv, resolveIcon, Countdown } from './index'
import type { Column } from './index'

describe('design system smoke', () => {
  it('Button renders and fires onClick', () => {
    const fn = vi.fn()
    render(<Button onClick={fn} variant="gold">Sotib olish</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Sotib olish' }))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('Button loading disables and shows busy', () => {
    render(<Button loading>Saqlash</Button>)
    const b = screen.getByRole('button')
    expect(b).toBeDisabled()
    expect(b).toHaveAttribute('aria-busy', 'true')
  })

  it("Money formats 620_000_000 tiyin as 6 200 000 so'm", () => {
    const { container } = render(<Money tiyin={620_000_000} />)
    const el = container.querySelector('[data-money]')
    expect(el?.textContent).toBe(formatMoney(620_000_000))
    expect(el?.textContent).toBe("6\u202F200\u202F000\u202Fso'm")
    // testing-library collapses the U+202F thin spaces to plain spaces when matching
    expect(screen.getByText("6 200 000 so'm")).toBe(el)
  })

  it('LedgerRow shows key and value', () => {
    render(
      <Ledger>
        <LedgerRow label="Yetkazish" value="25 000 so'm" />
        <LedgerRow label="Jami" value="6 225 000 so'm" emphasis />
      </Ledger>,
    )
    expect(screen.getByText('Yetkazish')).toBeInTheDocument()
    expect(screen.getByText("25 000 so'm")).toBeInTheDocument()
    expect(screen.getByText('Jami')).toBeInTheDocument()
  })

  it('Seal renders svg with two rings and icon', () => {
    const { container } = render(<Seal icon="shield-check" size={56} ticks label="Muhr" />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(2)
    expect(container.querySelectorAll('circle').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByText('Muhr')).toBeInTheDocument()
  })

  it('resolveIcon falls back to Circle', () => {
    expect(resolveIcon('smartphone')).not.toBe(resolveIcon('no-such-icon-xyz'))
    expect(resolveIcon('no-such-icon-xyz')).toBe(resolveIcon(undefined))
  })

  it('Stamp and Badge render text', () => {
    render(<><Stamp /><Badge tone="green">Faol</Badge></>)
    expect(screen.getByRole('img', { name: 'SOTILDI' })).toBeInTheDocument()
    expect(screen.getByText('Faol')).toBeInTheDocument()
  })

  it('Illustration renders a 200x200 viewBox svg', () => {
    const { container } = render(<Illustration id="ill-phone-1" />)
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 200 200')
  })

  it('Countdown renders m:ss', () => {
    render(<Countdown target="2026-01-01T10:01:42Z" now="2026-01-01T10:00:00Z" suffix="qoldi" />)
    expect(screen.getByText('1:42')).toBeInTheDocument()
    expect(screen.getByText('qoldi')).toBeInTheDocument()
  })

  interface Row { id: string; name: string; price: number }
  const rows: Row[] = [
    { id: 'a', name: 'iPhone 13', price: 620 },
    { id: 'b', name: 'Galaxy S21', price: 410 },
    { id: 'c', name: 'Redmi Note 12', price: 180 },
  ]
  const columns: Column<Row>[] = [
    { key: 'name', header: 'Nomi', sortable: true },
    { key: 'price', header: 'Narx', sortable: true, align: 'right', csv: (r) => r.price * 1000 },
  ]

  it('DataTable renders rows and sorts by column', () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={onRowClick} pageSize={25} />)
    const table = screen.getByRole('table')
    const bodyRows = () => within(table).getAllByRole('row').slice(1)
    expect(bodyRows()).toHaveLength(3)
    expect(screen.getByText('1–3 / 3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Narx/ }))
    expect(bodyRows()[0]).toHaveTextContent('Redmi Note 12')
    fireEvent.click(screen.getByRole('button', { name: /Narx/ }))
    expect(bodyRows()[0]).toHaveTextContent('iPhone 13')

    fireEvent.click(bodyRows()[1])
    expect(onRowClick).toHaveBeenCalledWith(rows[1])

    fireEvent.keyDown(table, { key: 'ArrowDown' })
    fireEvent.keyDown(table, { key: 'Enter' })
    expect(onRowClick).toHaveBeenCalledTimes(2)
  })

  it('buildCsv uses csv() mappers and headers', () => {
    const csv = buildCsv(columns, rows)
    expect(csv.split('\r\n')[0]).toBe('Nomi,Narx')
    expect(csv).toContain('iPhone 13,620000')
  })
})
