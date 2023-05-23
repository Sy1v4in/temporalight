export type Listener = (...arg: any[]) => any

export type EventBus = {
  on: (eventName: string, listener: Listener) => void
  off: (eventName: string) => void
  send: <Event = unknown>(eventName: string, event: Event) => Promise<boolean>
  close: () => Promise<void>
}
