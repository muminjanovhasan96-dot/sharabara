/**
 * Kabinet uchun api'da yo'q yupqa yordamchilar. Faqat store.update orqali yozadi.
 * Hisobotda qayd etilgan: setContractFile, addDocument.
 */
import { useStore } from '@/store'

export interface PartnerDocument { id: string; name: string; kind: string; at: string; pages: number; signed: boolean }

/** Shartnoma faylining nomini kompaniya kartasida saqlaydi (backend yo'q — faqat nom). */
export async function setContractFile(companyId: string, filename: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 250 + Math.random() * 250))
  const s = useStore.getState()
  s.update((d) => {
    const c = d.companies.find((x) => x.id === companyId)
    if (!c) return
    c.contractFile = filename
    d.audit.unshift({
      id: `A-${Date.now().toString(36)}-doc`, at: s.clock.now, actorId: c.id, actorName: c.name, role: 'company',
      kind: 'data', entity: 'company', entityId: c.id, field: 'contractFile', from: null, to: filename,
    })
    if (d.audit.length > 2000) d.audit.length = 2000
  })
}
