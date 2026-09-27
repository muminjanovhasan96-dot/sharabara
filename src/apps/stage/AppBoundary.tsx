/**
 * Bitta ichki ilova buzilsa (yoki hali yozilmagan bo'lsa) sahna yiqilmasin — o'rnida paper karta.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { uz } from '@/i18n/uz'

interface Props {
  name: string
  /** changes when the stage navigates this app again → a crashed app gets a fresh mount */
  resetSignal?: number
  children: ReactNode
}
interface State { error: Error | null; seenSignal: number | undefined }

export class AppBoundary extends Component<Props, State> {
  state: State = { error: null, seenSignal: undefined }
  static getDerivedStateFromError(error: Error): Partial<State> { return { error } }
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetSignal === state.seenSignal) return null
    // the stage navigated this app again → drop the crash and let it mount fresh
    return { seenSignal: props.resetSignal, error: null }
  }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(`[stage] ${this.props.name}:`, error, info.componentStack) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex h-full w-full items-center justify-center bg-paper p-6 text-ink" role="alert">
        <div className="max-w-[360px] rounded-[18px] border border-line bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-brick"><TriangleAlert size={18} strokeWidth={1.75} /><span className="font-semibold">{this.props.name} yuklanmadi</span></div>
          <p className="mt-2 text-[13px] leading-snug text-ink-2">{uz.app.errorHint}</p>
          <p className="mt-2 break-words font-mono text-[11px] text-ink-3">{this.state.error.message}</p>
          <button type="button" onClick={() => this.setState({ error: null })} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-card px-3 text-[13px] font-medium hover:bg-paper-2">
            <RotateCcw size={14} strokeWidth={1.75} />{uz.app.retry}
          </button>
        </div>
      </div>
    )
  }
}
