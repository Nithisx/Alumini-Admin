import { registerSW } from 'virtual:pwa-register'

// Immediate registration allows installability checks as soon as the app loads.
registerSW({ immediate: true })
