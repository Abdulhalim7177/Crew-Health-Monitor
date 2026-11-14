// React hook: re-render when the shared store changes (in this tab or another tab).
import { useSyncExternalStore } from 'react'
import { getStore, type StoreState } from './store'

export function useStore(): StoreState {
  const store = getStore()
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

/** Signed-in user for this tab, re-read on every store change. */
export function useCurrentUser() {
  useStore()
  return getStore().currentUser()
}
