/**
 * react-router v7 bitta Router ichida ikkinchisini man qiladi. Sahna esa /stage (BrowserRouter) ichida
 * har ilovaga o'z MemoryRouter'ini beradi — shuning uchun tashqi router kontekstlarini bo'sh holatga qaytaramiz.
 */
import type { ReactNode } from 'react'
import {
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
  UNSAFE_LocationContext as LocationContext,
  UNSAFE_NavigationContext as NavigationContext,
  UNSAFE_RouteContext as RouteContext,
} from 'react-router-dom'

const EMPTY_ROUTE = { outlet: null, matches: [], isDataRoute: false }

/** Children see no parent router: a fresh <MemoryRouter> can be mounted inside. */
export function RouterIsland({ children }: { children: ReactNode }) {
  return (
    <DataRouterContext.Provider value={null}>
      <DataRouterStateContext.Provider value={null}>
        <NavigationContext.Provider value={null as never}>
          <LocationContext.Provider value={null as never}>
            <RouteContext.Provider value={EMPTY_ROUTE}>{children}</RouteContext.Provider>
          </LocationContext.Provider>
        </NavigationContext.Provider>
      </DataRouterStateContext.Provider>
    </DataRouterContext.Provider>
  )
}
