import { useCallback, useMemo, useRef, useState } from 'react'
import { CircleCheck, Download, FileSpreadsheet, FlaskConical, TriangleAlert, Upload } from 'lucide-react'
import { Button, Card, CardHeader, ErrorState, Progress, Select, Stamp } from '@/design'
import { toast } from '../toast'
import { api } from '@/api'
import { useData, useSession } from '@/store'
import { t } from '@/i18n/uz'
import { cn } from '@/lib/utils'
import { useAppNavigate } from '@/lib/router'
import { useCompany, useCompanyProducts } from '../hooks'
import { ALL_FIELDS, REQUIRED, downloadTemplate, guessMapping, parseWorkbook, sampleWorkbookBuffer, validateRows, type FieldKey, type Mapping, type ParsedSheet } from '../importLib'
import { P } from '../strings'
import { PageHeader } from '../ui'

type Step = 0 | 1 | 2 | 3

/** Kompaniya o'zgarsa qadamlar qayta boshlanadi (key orqali). */
export function Import() {
  const { companyId } = useSession()
  return <ImportInner key={companyId} />
}

function ImportInner() {
  const c = useCompany()
  const existing = useCompanyProducts(c.id)
  const categories = useData((d) => d.categories)
  const nav = useAppNavigate()
  const [step, setStep] = useState<Step>(0)
  const [fileName, setFileName] = useState('')
  const [sheet, setSheet] = useState<ParsedSheet | null>(null)
  const [map, setMap] = useState<Mapping>({})
  const [guessedKeys, setGuessedKeys] = useState<FieldKey[]>([])
  const [parseErr, setParseErr] = useState(false)
  const [drag, setDrag] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ added: number; updated: number; skipped: number } | null>(null)
  const [failed, setFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback((buf: ArrayBuffer, name: string) => {
    try {
      const s = parseWorkbook(buf)
      const g = guessMapping(s.headers)
      setSheet(s); setMap(g); setGuessedKeys(Object.keys(g) as FieldKey[]); setFileName(name); setParseErr(false); setStep(1)
    } catch { setParseErr(true) }
  }, [])
  const onFile = async (f: File | undefined) => { if (!f) return; load(await f.arrayBuffer(), f.name) }
  const useSample = () => load(sampleWorkbookBuffer(existing), P.import.sampleName)

  const validated = useMemo(() => (sheet ? validateRows(sheet.rows, map, existing, categories) : null), [sheet, map, existing, categories])
  const mappingOk = REQUIRED.every((k) => map[k] !== undefined)

  const confirm = async () => {
    if (!validated) return
    setStep(3); setProgress(6); setFailed(false); setResult(null)
    const timer = setInterval(() => setProgress((p) => Math.min(92, p + 4 + Math.random() * 6)), 120)
    try {
      const r = await api.partner.importProducts(validated.ok)
      clearInterval(timer); setProgress(100)
      setResult({ ...r, skipped: new Set(validated.errors.map((e) => e.row)).size })
      toast.success(P.import.doneTitle, { description: `${r.added} ${P.import.added} · ${r.updated} ${P.import.updated}` })
    } catch { clearInterval(timer); setFailed(true) }
  }
  const reset = () => { setStep(0); setSheet(null); setMap({}); setFileName(''); setResult(null); setProgress(0) }

  return (
    <div>
      <PageHeader eyebrow={c.name} help={P.help.import} title={P.import.title} actions={<Button variant="secondary" leading={<Download />} onClick={downloadTemplate}>{P.import.template}</Button>}>{P.import.lead}</PageHeader>

      <ol className="mb-5 flex list-none flex-wrap gap-2 p-0" aria-label="Qadamlar">
        {P.import.steps.map((s, i) => (
          <li key={s} className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium', i === step ? 'border-transparent bg-blue text-white' : i < step ? 'border-transparent bg-green-soft text-green' : 'border-line bg-card text-ink-3')} aria-current={i === step ? 'step' : undefined}>
            <span className={cn('tnum inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold', i === step ? 'bg-white/20' : 'border border-current')}>{i < step ? '✓' : i + 1}</span>{s}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card padding="none" className={cn('transition-colors', drag && 'border-blue bg-blue-soft')}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); void onFile(e.dataTransfer.files[0]) }}
              className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center"
            >
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-soft text-blue"><FileSpreadsheet size={28} strokeWidth={1.5} aria-hidden="true" /></span>
              <div className="font-display text-[20px] text-ink">{P.import.drop}</div>
              <div className="text-[13px] text-ink-3">{P.import.dropHint}</div>
              <div className="text-[13px] text-ink-3">{P.import.or}</div>
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" aria-label={P.import.fileLabel} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
              <Button variant="gold" leading={<Upload />} onClick={() => inputRef.current?.click()}>{P.import.choose}</Button>
              {parseErr && <ErrorState compact title={P.import.parseError} hint={P.import.parseErrorHint} className="mt-3 w-full max-w-[420px]" />}
            </div>
          </Card>
          <Card padding="md" className="flex flex-col gap-3">
            <CardHeader eyebrow="Demo" title={P.import.sample} />
            <p className="m-0 text-[14px] leading-relaxed text-ink-2">24 qatorli namuna fayl: 18 ta yangi tovar, 4 ta mavjud tovar kodi (yangilanadi) va 3 ta xatoli qator. Fayl xotirada yaratiladi va oddiy yuklash kabi ishlanadi.</p>
            <Button variant="secondary" leading={<FlaskConical />} onClick={useSample}>{P.import.sample}</Button>
            <div className="mt-2 border-t border-line pt-3 text-[13px] text-ink-3">
              <div className="eyebrow mb-1">Shablon ustunlari</div>
              Tovar kodi · Nomi · Narx (so’m) · Zaxira · Kategoriya · Kafolat (oy) · Tavsif
            </div>
          </Card>
        </div>
      )}

      {step === 1 && sheet && (
        <Card padding="md">
          <CardHeader eyebrow={t(P.import.detected, { rows: sheet.rows.length, cols: sheet.headers.length, sheet: sheet.sheet })} title={P.import.mapTitle}>
            <span className="text-[13px] text-ink-2">{fileName} · {P.import.mapLead}</span>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_FIELDS.map((f) => {
              const req = REQUIRED.includes(f)
              const missing = req && map[f] === undefined
              return (
                <label key={f} className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
                  <span className="flex items-center gap-1.5">{P.import.fields[f]}{req && <span className="text-brick" aria-hidden="true">*</span>}{guessedKeys.includes(f) && map[f] !== undefined && <span className="rounded-full bg-blue-soft px-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-blue">{P.import.guessed}</span>}</span>
                  <Select size="sm" invalid={missing} value={map[f] === undefined ? '' : String(map[f])} onChange={(e) => { const v = e.target.value; setMap((m) => { const n = { ...m }; if (v === '') delete n[f]; else n[f] = Number(v); return n }); setGuessedKeys((k) => k.filter((x) => x !== f)) }}>
                    <option value="">{P.import.notMapped}</option>
                    {sheet.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </Select>
                </label>
              )
            })}
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
            <Button variant="ghost" onClick={reset}>{P.import.back}</Button>
            <div className="flex items-center gap-3">{!mappingOk && <span className="text-[13px] text-brick">{P.import.needRequired}</span>}<Button variant="gold" disabled={!mappingOk} onClick={() => setStep(2)}>{P.import.next}</Button></div>
          </div>
        </Card>
      )}

      {step === 2 && sheet && validated && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-line px-4 py-3"><CardHeader className="mb-0" title={P.import.preview} eyebrow={fileName} /></div>
            <div className="scroll-thin max-h-[440px] overflow-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="sticky top-0 bg-paper shadow-[inset_0_-1px_0_var(--line)]"><tr><th className="eyebrow px-3 py-2 text-left">№</th>{ALL_FIELDS.filter((f) => map[f] !== undefined).map((f) => <th key={f} className="eyebrow whitespace-nowrap px-3 py-2 text-left">{P.import.fields[f]}</th>)}</tr></thead>
                <tbody>
                  {sheet.rows.slice(0, 20).map((r, i) => {
                    const line = i + 2
                    const bad = validated.errors.some((e) => e.row === line)
                    return (
                      <tr key={i} className={cn('h-10 border-t border-line', bad && 'bg-brick-soft/60 text-ink-3 line-through decoration-brick/50')}>
                        <td className="tnum px-3 py-1.5 text-ink-3">{line}</td>
                        {ALL_FIELDS.filter((f) => map[f] !== undefined).map((f) => <td key={f} className="max-w-[260px] truncate px-3 py-1.5">{String(r[map[f]!] ?? '')}</td>)}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex flex-col gap-4">
            <Card padding="md">
              <CardHeader title={P.import.errors} eyebrow={validated.errors.length ? P.import.excluded : undefined} />
              {validated.errors.length === 0 ? (
                <div className="flex items-center gap-2 text-[14px] text-green"><CircleCheck size={18} strokeWidth={1.75} aria-hidden="true" />{P.import.noErrors}</div>
              ) : (
                <ul className="scroll-thin m-0 max-h-[200px] list-none overflow-auto p-0 text-[13px]">
                  {validated.errors.map((e, i) => <li key={i} className="flex items-center gap-2 border-t border-line py-1.5 first:border-t-0"><TriangleAlert size={14} strokeWidth={1.75} className="shrink-0 text-brick" aria-hidden="true" /><span className="tnum font-medium text-ink">{t(P.import.errRow, { n: e.row })}:</span><span className="text-ink-2">{e.msg}</span></li>)}
                </ul>
              )}
            </Card>
            <Card padding="md" className="border-gold/30 bg-gold-soft">
              <div className="font-display text-[18px] leading-snug text-ink">{t(P.import.summary, { add: validated.adds, upd: validated.updates })}</div>
              {validated.errors.length > 0 && <div className="mt-1 text-[13px] text-ink-2">{t(P.import.skipped, { n: new Set(validated.errors.map((e) => e.row)).size })}</div>}
              <div className="mt-4 flex items-center justify-between gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>{P.import.back}</Button>
                <Button variant="gold" size="lg" disabled={validated.ok.length === 0} onClick={() => void confirm()}>{P.import.confirm}</Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card padding="lg" className="mx-auto max-w-[560px] text-center">
          {failed ? <ErrorState onRetry={() => void confirm()} /> : !result ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="font-display text-[20px] text-ink">{P.import.uploading}</div>
              <Progress value={progress} size="md" className="max-w-[360px]" label={P.import.uploading} />
              <div className="text-[13px] text-ink-3">{P.import.uploadingHint}</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2">
              <Stamp text="Yuklandi" tone="green" size="lg" />
              <div className="font-display text-[22px] text-ink">{P.import.doneTitle}</div>
              <div className="grid w-full grid-cols-3 gap-3">
                {[[result.added, P.import.added], [result.updated, P.import.updated], [result.skipped, P.import.skippedShort]].map(([n, l]) => (
                  <div key={String(l)} className="rounded-card border border-line bg-paper-2 p-3"><div className="tnum font-display text-[28px] text-ink">{n}</div><div className="eyebrow">{l}</div></div>
                ))}
              </div>
              <div className="flex gap-2"><Button variant="secondary" onClick={reset}>{P.import.again}</Button><Button variant="gold" onClick={() => nav('/products')}>{P.import.toProducts}</Button></div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
