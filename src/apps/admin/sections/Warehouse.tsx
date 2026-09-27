import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Segmented, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, Button } from '@/design'
import { useNow, useStore } from '@/store'
import { uz } from '@/i18n/uz'
import { dateKey } from '@/domain/clock'
import { useAccess } from '../lib/sections'
import { useQueryParam, useSectionLoading } from '../lib/hooks'
import { A } from '../strings'
import { Kpi } from '../components/ui'
import { dailyTotals, inWh, lastCostMap, lastDays, stockHistory, whShort, type WhFilter } from './warehouse/lib'
import { StockTab } from './warehouse/StockTab'
import { ReceiptsTab } from './warehouse/ReceiptsTab'
import { SalesTab } from './warehouse/SalesTab'
import { MovementsTab } from './warehouse/MovementsTab'
import { NewProductModal } from './warehouse/NewProductModal'

type Tab = 'stock' | 'receipts' | 'sales' | 'movements'
const TABS: Tab[] = ['stock', 'receipts', 'sales', 'movements']

export function Warehouse() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const access = useAccess('warehouse')
  const loading = useSectionLoading()
  const [qtab, setQtab] = useQueryParam('tab')
  const tab: Tab = (TABS as string[]).includes(qtab ?? '') ? (qtab as Tab) : 'stock'
  const [wh, setWh] = useState<WhFilter>('all')
  const [newProduct, setNewProduct] = useState(false)
  const today = dateKey(now)

  const kpi = useMemo(() => {
    const levels = data.stockLevels.filter((l) => inWh(wh, l.warehouseId))
    const movs = data.movements.filter((m) => inWh(wh, m.warehouseId))
    const cost = lastCostMap(data)
    const days = lastDays(now, 14)
    const todayM = movs.filter((m) => dateKey(m.at) === today)
    return {
      total: levels.reduce((a, l) => a + l.qty, 0),
      value: levels.reduce((a, l) => a + l.qty * (cost.get(l.productId) ?? 0), 0),
      low: levels.filter((l) => l.qty <= l.minQty).length,
      inToday: todayM.filter((m) => m.kind === 'in').reduce((a, m) => a + m.qty, 0),
      outToday: todayM.filter((m) => m.kind === 'out').reduce((a, m) => a + Math.abs(m.qty), 0),
      expected: data.receipts.filter((r) => r.status === 'expected' && inWh(wh, r.warehouseId)).length,
      sparkStock: stockHistory(levels, movs, days),
      sparkIn: dailyTotals(movs, days, 'in'),
      sparkOut: dailyTotals(movs, days, 'out'),
    }
  }, [data, wh, now, today])

  if (loading) return <div className="flex flex-col gap-4 p-5"><div className="flex items-center justify-between"><Skeleton height={36} width={360} /><Skeleton height={36} width={140} /></div><div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={104} className="rounded-card" />)}</div><Skeleton height={44} width={480} /><Skeleton height={420} className="rounded-card" /></div>

  const K = A.warehouse.kpi
  const defaultWh = wh === 'all' ? data.warehouses[0]?.id ?? '' : wh
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented aria-label={uz.admin.sections.warehouse} value={wh} onChange={setWh} options={[{ value: 'all', label: A.warehouse.all }, ...data.warehouses.map((w) => ({ value: w.id, label: whShort(data, w.id) }))]} />
        <Button size="sm" variant="gold" leading={<Plus strokeWidth={1.75} />} disabled={!access.edit} onClick={() => setNewProduct(true)}>{A.warehouse.newProduct}</Button>
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label={K.total} value={kpi.total} suffix={uz.app.pcs} spark={kpi.sparkStock} hint={K.days14} />
        <Kpi label={K.value} value={kpi.value / 100 / 1e9} format={(v) => v.toFixed(1).replace('.', ',')} suffix={`${K.mlrd} ${uz.app.sum}`} tone="gold" />
        <Kpi label={K.low} value={kpi.low} suffix="SKU" onClick={() => setQtab('stock')} className={kpi.low > 0 ? 'shadow-[inset_3px_0_0_var(--brick)]' : undefined} />
        <Kpi label={K.inToday} value={kpi.inToday} suffix={uz.app.pcs} spark={kpi.sparkIn} hint={K.days14} tone="green" />
        <Kpi label={K.outToday} value={kpi.outToday} suffix={uz.app.pcs} spark={kpi.sparkOut} hint={K.days14} tone="brick" />
        <Kpi label={K.expected} value={kpi.expected} onClick={() => setQtab('receipts')} />
      </div>
      <Tabs value={tab} onValueChange={(v) => setQtab(v === 'stock' ? null : v)}>
        <TabsList>
          {TABS.map((t) => <TabsTrigger key={t} value={t} count={t === 'stock' && kpi.low > 0 ? kpi.low : t === 'receipts' && kpi.expected > 0 ? kpi.expected : undefined}>{A.warehouse.tabs[t]}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="stock" className="pt-4">{tab === 'stock' && <StockTab wh={wh} canEdit={access.edit} />}</TabsContent>
        <TabsContent value="receipts" className="pt-4">{tab === 'receipts' && <ReceiptsTab wh={wh} canEdit={access.edit} />}</TabsContent>
        <TabsContent value="sales" className="pt-4">{tab === 'sales' && <SalesTab wh={wh} />}</TabsContent>
        <TabsContent value="movements" className="pt-4">{tab === 'movements' && <MovementsTab wh={wh} />}</TabsContent>
      </Tabs>
      <NewProductModal open={newProduct} onClose={() => setNewProduct(false)} defaultWh={defaultWh} />
    </div>
  )
}
