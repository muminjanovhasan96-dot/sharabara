import { createContext, useContext } from 'react'

/** PartnerApp ildizidagi #print-root elementi — Akt-sverka window.print() uchun. */
export const PrintRootCtx = createContext<HTMLElement | null>(null)
export function usePrintRoot() { return useContext(PrintRootCtx) }
