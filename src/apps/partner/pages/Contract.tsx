import { useRef, useState } from 'react'
import { Eye, FileText, Upload } from 'lucide-react'
import { Badge, Button, Card, CardHeader, Ledger, LedgerRow, Modal, Seal, Skeleton, Stamp } from '@/design'
import { toast } from '../toast'
import { useNow } from '@/store'
import { addDays, formatDemoDate } from '@/domain/clock'
import { t } from '@/i18n/uz'
import { useCompany, useListLoading } from '../hooks'
import { setContractFile } from '../localApi'
import { P } from '../strings'
import { PageHeader, fmtDate } from '../ui'

type DocKey = 'contract' | 'akt' | 'annex'

export function Contract() {
  const c = useCompany()
  const now = useNow()
  const loading = useListLoading(c.id)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [doc, setDoc] = useState<DocKey | null>(null)

  const upload = async (f: File | undefined) => {
    if (!f) return
    setBusy(true)
    try { await setContractFile(c.id, f.name); toast.success(P.contract.uploaded, { description: f.name }) } catch { toast.error(P.common.error) } finally { setBusy(false) }
  }
  const docs: { key: DocKey; name: string; kind: string; at: string; pages: number; signed: boolean }[] = [
    { key: 'contract', name: P.contract.docList.contract, kind: P.contract.docKinds.contract, at: c.joinedAt, pages: 6, signed: true },
    { key: 'akt', name: P.contract.docList.akt, kind: P.contract.docKinds.akt, at: addDays(now, -25), pages: 2, signed: true },
    { key: 'annex', name: P.contract.docList.annex, kind: P.contract.docKinds.annex, at: addDays(c.joinedAt, 1), pages: 1, signed: false },
  ]
  const openDoc = docs.find((d) => d.key === doc)

  return (
    <div>
      <PageHeader eyebrow={c.name} help={P.help.contract} title={P.contract.title} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4">
          <Card padding="md">
            <CardHeader title={P.contract.profile} actions={<Seal icon={c.sealIcon} size={40} variant="gold" />} />
            {loading ? <Skeleton height={180} /> : (
              <Ledger>
                <LedgerRow label={P.contract.inn} value={c.inn} />
                <LedgerRow label={P.contract.model} value={P.model[c.model]} />
                <LedgerRow label={P.contract.commission} value={`${Math.round(c.commissionRate * 100)}%`} />
                <LedgerRow label={P.contract.joined} value={formatDemoDate(c.joinedAt)} />
                <LedgerRow label={P.contract.rating} value={`${c.rating.toFixed(1)} / 5`} />
                <LedgerRow label={P.contract.status} value={<Badge tone={c.status === 'active' ? 'green' : c.status === 'onboarding' ? 'gold' : 'brick'} dot>{P.status[c.status]}</Badge>} />
              </Ledger>
            )}
          </Card>
          <Card padding="md">
            <CardHeader title={P.contract.contractFile} />
            <div className="flex items-center gap-3 rounded-card border border-line bg-paper-2 p-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line bg-card text-ink-2"><FileText size={20} strokeWidth={1.75} aria-hidden="true" /></span>
              <div className="min-w-0 flex-1"><div className={c.contractFile ? 'truncate font-medium text-ink' : 'text-ink-3'}>{c.contractFile ?? P.contract.notUploaded}</div><div className="text-[12px] text-ink-3">{c.contractFile ? `PDF · ${formatDemoDate(c.joinedAt)}` : 'PDF, DOCX'}</div></div>
              <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="sr-only" aria-label={P.contract.upload} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = '' }} />
              <Button variant="secondary" size="sm" leading={<Upload />} loading={busy} onClick={() => inputRef.current?.click()}>{c.contractFile ? P.contract.replace : P.contract.upload}</Button>
            </div>
          </Card>
        </div>
        <Card padding="md" className="self-start">
          <CardHeader title={P.contract.docs} />
          {loading ? <div className="flex flex-col gap-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height={72} />)}</div> : (
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
              {docs.map((d) => (
                <li key={d.key}>
                  <button type="button" onClick={() => setDoc(d.key)} className="group flex h-full w-full flex-col rounded-card border border-line bg-card p-4 text-left shadow-soft transition-colors hover:border-blue/40 focus-visible:ring-2 focus-visible:ring-blue">
                    <div className="mb-3 h-[92px] w-full overflow-hidden rounded-[6px] border border-line bg-paper p-2.5 text-[7px] leading-[1.5] text-ink-3" aria-hidden="true">
                      <div className="mb-1 h-1.5 w-1/2 rounded bg-ink/60" />{Array.from({ length: 7 }, (_, i) => <div key={i} className="mb-1 h-1 rounded bg-ink/15" style={{ width: `${60 + ((i * 17) % 40)}%` }} />)}
                    </div>
                    <div className="font-medium text-ink group-hover:underline">{d.name}</div>
                    <div className="text-[12px] text-ink-3">{d.kind} · {t(P.contract.pages, { n: d.pages })}</div>
                    <div className="mt-2 flex items-center justify-between text-[12px] text-ink-3"><span>{fmtDate(d.at)}</span>{d.signed && <Badge tone="green" size="sm">{P.contract.signed}</Badge>}</div>
                    <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-blue"><Eye size={14} strokeWidth={1.75} aria-hidden="true" />{P.contract.view}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={Boolean(openDoc)} onOpenChange={(v) => { if (!v) setDoc(null) }} size="lg" title={openDoc?.name} description={P.contract.previewNote} footer={<Button variant="secondary" onClick={() => setDoc(null)}>{P.common.close}</Button>}>
        {openDoc && (
          <div className="scroll-thin max-h-[60vh] overflow-auto rounded-[8px] bg-paper-2 p-3">
            <article className="relative rounded-[4px] border border-line bg-[#fffdf7] p-8 text-[13px] leading-relaxed text-ink shadow-soft">
              <header className="flex items-start justify-between border-b-2 border-ink pb-3"><div><div className="font-display text-[20px] font-bold uppercase tracking-wide">SHARA-BARA</div><div className="eyebrow">{P.billing.aktSharabara}</div></div><div className="text-right text-[12px] text-ink-2"><div className="font-display text-[15px] font-bold text-ink">{openDoc.name}</div><div>{fmtDate(openDoc.at)} · {t(P.contract.pages, { n: openDoc.pages })}</div></div></header>
              <h3 className="mt-5 font-display text-[16px]">1. Umumiy qoidalar</h3>
              <p>Ushbu hujjat {P.billing.aktSharabara} («Platforma») va {c.name} (STIR {c.inn}, «Hamkor») o’rtasidagi Sharabara Mall orqali tovarlarni sotish tartibini belgilaydi. Hamkorlik modeli: {P.model[c.model]}.</p>
              <h3 className="mt-4 font-display text-[16px]">2. Komissiya va hisob-kitob</h3>
              <p>Platforma har bir yetkazilgan buyurtma summasidan {Math.round(c.commissionRate * 100)}% komissiya ushlab qoladi. To’lovlar har juma kuni Hamkorning ko’rsatilgan kartasiga o’tkaziladi. Oylik akt-sverka kabinetda avtomatik shakllanadi.</p>
              <h3 className="mt-4 font-display text-[16px]">3. Narx qoidasi</h3>
              <p>Hamkor tovar narxi Sharabara bozor o’rtachasidan yuqori bo’lsa, tovar «Qimmat» belgisi bilan ko’rsatiladi va tavsiyalarda pastroq o’rin oladi. Hamkor narxni istalgan vaqtda kabinet yoki API orqali yangilashi mumkin.</p>
              <h3 className="mt-4 font-display text-[16px]">4. Yetkazish</h3>
              <p>{c.model === 'self_ship' ? 'Hamkor buyurtmani o’zi qadoqlab, BTS filialiga topshiradi. Kechikish reytingga ta’sir qiladi.' : 'Tovar Sharabara omborida saqlanadi, qadoqlanadi va BTS orqali xaridorga yetkaziladi.'} Yetkazish muddati: {c.shipSpeedDays} kun.</p>
              <div className="mt-8 grid grid-cols-2 gap-10 text-[12px]"><div><div className="border-b border-ink pb-8 text-ink-2">{P.billing.aktSign1}</div><div className="mt-1 text-ink-3">{P.billing.aktSign}, M.O’.</div></div><div><div className="border-b border-ink pb-8 text-ink-2">{P.billing.aktSign2} — {c.name}</div><div className="mt-1 text-ink-3">{P.billing.aktSign}, M.O’.</div></div></div>
              {openDoc.signed && <div className="pointer-events-none absolute bottom-16 right-10"><Stamp text="Imzolangan" tone="green" size="md" /></div>}
            </article>
          </div>
        )}
      </Modal>
    </div>
  )
}
