import { io, Socket as ClientSocket } from 'socket.io-client'

import { ClientOptions } from './types'
import { EventBus, Listener } from '../../../domain/worker'

class WebSocketClientEventBus implements EventBus {
  #socket: ClientSocket

  constructor(options: ClientOptions) {
    this.#socket = io(options.url)
  }

  on(eventName: string, listener: Listener): void {
    this.#socket.on(eventName, (...args) => {
      const ackCallback = args[args.length - 1]
      listener(args.slice(0, -1))
      ackCallback('ACK')
    })
  }

  off(eventName: string) {
    this.#socket.removeAllListeners(eventName)
  }

  async send<Event>(eventName: string, event: Event): Promise<boolean> {
    try {
      this.#socket.timeout(1000).emit(eventName, event)
      return true
    } catch (e) {
      return false
    }
  }

  async close(): Promise<void> {
    this.#socket.disconnect()
  }
}

export { WebSocketClientEventBus }
