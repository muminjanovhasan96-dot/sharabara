import { useEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, Clock, Search as SearchIcon, Tag } from 'lucide-react'
import { useStore } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { useDebounced } from '@/lib/hooks'
import { uz, t } from '@/i18n/uz'
import { MODEL_DICTIONARY } from '@/seed'
import { Button, SearchInput, toast } from '@/design'
import { EmptyState } from '../components/Ui'
import { ms } from '../strings'
import { useList, useQuery } from '../lib'
import { localApi } from '../localApi'
import { Screen } from '../components/Screen'
import { ListingCard, ProductCard } from '../components/Cards'

export default function Search() {
  const nav = useAppNavigate()
  const q0 = useQuery().get('q') ?? ''
  const [q, setQ] = useState(q0)
  const [submitted, setSubmitted] = useState(q0)
  const dq = useDebounced(q, 180)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { const tm = setTimeout(() => ref.current?.focus(), 350); return () => clearTimeout(tm) }, [])
  useEffect(() => { if (q0) submit(q0) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const recent = useStore((s) => s.ui.recentSearches)
  const categories = useStore((s) => s.data.categories)
  const listings = useStore((s) => s.data.listings)
  const products = useStore((s) => s.data.products)
  const savedSearches = useList((s) => s.data.savedSearches.filter((x) => x.userId === s.session.userId))

  const suggestions = useMemo(() => {
    const v = dq.trim().toLowerCase()
    if (!v) return { models: [] as string[], cats: [] as { id: string; name: string }[] }
    const models = Array.from(new Set(MODEL_DICTIONARY.filter((m) => m.model.toLowerCase().includes(v) || m.aliases.some((a) => a.includes(v))).map((m) => m.model))).slice(0, 6)
    const cats = categories.filter((c) => c.name.toLowerCase().includes(v)).slice(0, 3).map((c) => ({ id: c.id, name: c.name }))
    return { models, cats }
  }, [dq, categories])

  const results = useMemo(() => {
    const v = submitted.trim().toLowerCase()
    if (!v) return null
    const toks = v.split(/\s+/).filter(Boolean)
    const hit = (s: string) => { const x = s.toLowerCase(); return toks.every((tk) => x.includes(tk)) }
    const ls = listings.filter((l) => l.status === 'published' && !l.historical && (hit(l.title) || hit(l.description)))
    const ps = products.filter((p) => p.stock > 0 && hit(p.title))
    return { ls: ls.slice(0, 40), ps: ps.slice(0, 20), n: ls.length + ps.length }
  }, [submitted, listings, products])

  function submit(text: string) {
    const v = text.trim(); if (!v) return
    setQ(v); setSubmitted(v)
    localApi.addRecentSearch(v)
    void api.listings.trackEvent({ kind: 'search', query: v })
  }
  const alreadySaved = savedSearches.some((s) => s.query.toLowerCase() === submitted.trim().toLowerCase())
  const saveSearch = async () => {
    try { await api.listings.saveSearch(submitted.trim()); toast.success(uz.search.saved) } catch { toast.error(uz.app.error) }
  }

  const typing = q.trim().length > 0 && q.trim() !== submitted.trim()
  return (
    <Screen
      header={
        <header className="pt-safe flex shrink-0 items-center gap-2 border-b border-line bg-card px-3 py-2">
          <form className="flex-1" onSubmit={(e) => { e.preventDefault(); submit(q) }}>
            <SearchInput ref={ref} value={q} onChange={setQ} onClear={() => { setSubmitted('') }} placeholder={uz.search.placeholder} enterKeyHint="search" autoComplete="off" />
          </form>
          <Button variant="ghost" size="sm" onClick={() => nav('/')}>{uz.app.cancel}</Button>
        </header>
      }
    >
      {(!submitted || typing) && (
        <div className="flex flex-col gap-4 pt-3">
          {typing && (suggestions.models.length > 0 || suggestions.cats.length > 0) && (
            <section>
              <div className="eyebrow mb-1.5">{uz.search.suggestions}</div>
              <ul className="m-0 list-none divide-y divide-line p-0">
                {suggestions.models.map((m) => (
                  <li key={m}><button type="button" onClick={() => submit(m)} className="flex min-h-[44px] w-full items-center gap-3 text-left text-[15px]"><SearchIcon size={16} className="text-ink-3" strokeWidth={1.75} />{m}</button></li>
                ))}
                {suggestions.cats.map((c) => (
                  <li key={c.id}><button type="button" onClick={() => nav(`/catalog?cat=${c.id}`)} className="flex min-h-[44px] w-full items-center gap-3 text-left text-[15px]"><Tag size={16} className="text-ink-3" strokeWidth={1.75} />{c.name}<span className="ml-auto text-[12px] text-ink-3">{uz.tabs.catalog}</span></button></li>
                ))}
              </ul>
            </section>
          )}
          {recent.length > 0 && (
            <section>
              <div className="eyebrow mb-1.5">{uz.search.recent}</div>
              <ul className="m-0 list-none divide-y divide-line p-0">
                {recent.filter((r) => !typing || r.toLowerCase().includes(q.trim().toLowerCase())).map((r) => (
                  <li key={r}><button type="button" onClick={() => submit(r)} className="flex min-h-[44px] w-full items-center gap-3 text-left text-[15px]"><Clock size={16} className="text-ink-3" strokeWidth={1.75} />{r}</button></li>
                ))}
              </ul>
            </section>
          )}
          {savedSearches.length > 0 && !typing && (
            <section>
              <div className="eyebrow mb-1.5">{uz.profile.savedSearches}</div>
              <ul className="m-0 list-none divide-y divide-line p-0">
                {savedSearches.map((s) => (
                  <li key={s.id}><button type="button" onClick={() => submit(s.query)} className="flex min-h-[44px] w-full items-center gap-3 text-left text-[15px]"><Bookmark size={16} className="text-ink-3" strokeWidth={1.75} />{s.query}</button></li>
                ))}
              </ul>
            </section>
          )}
          {!typing && recent.length === 0 && <EmptyState compact icon="search" title={ms.search.startTyping} />}
        </div>
      )}

      {submitted && !typing && results && (
        <div className="pt-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="tnum text-[13px] text-ink-2">{t(uz.search.results, { n: results.n })}</span>
            <Button variant="secondary" size="sm" leading={<Bookmark strokeWidth={1.75} />} onClick={saveSearch} disabled={alreadySaved}>{alreadySaved ? uz.app.done : uz.search.saveSearch}</Button>
          </div>
          {results.n === 0 ? (
            <EmptyState icon="search-x" title={uz.search.noResults} hint={uz.search.noResultsHint} action={<Button variant="secondary" size="sm" onClick={saveSearch}>{uz.search.saveSearch}</Button>} />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {results.ls.map((l) => <ListingCard key={l.id} listing={l} />)}
              {results.ps.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      )}
    </Screen>
  )
}
