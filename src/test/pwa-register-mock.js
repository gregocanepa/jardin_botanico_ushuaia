// Mock of 'virtual:pwa-register/react' for unit tests (no service worker in jsdom).
export function useRegisterSW() {
  return {
    offlineReady: [false, () => {}],
    needRefresh: [false, () => {}],
    updateServiceWorker: async () => {},
  }
}
