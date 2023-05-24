import { EventEmitter } from 'events'

import { NoWorkflow } from '../../domain/errors'
import { EventBus, Listener } from '../../domain/ports'

class InMemoryEventBus implements EventBus {
  #eventEmitter: EventEmitter

  constructor() {
    this.#eventEmitter = new EventEmitter()
  }

  on(eventName: string, listener: Listener): void {
    this.#eventEmitter.on(eventName, listener)
  }

  off(eventName: string): void {
    this.#eventEmitter.removeAllListeners(eventName)
  }

  async send<Event>(eventName: string, event: Event): Promise<boolean> {
    const hasBeenEmitted = this.#eventEmitter.emit(eventName, event)
    if (!hasBeenEmitted) throw new NoWorkflow(eventName)
    return hasBeenEmitted
  }

  async close(): Promise<void> {
    // Nothing to do in this implementation
  }
}

export { InMemoryEventBus }
