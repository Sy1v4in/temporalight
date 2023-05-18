import { Server as SocketServer, Socket } from 'socket.io'

import { ServerOptions } from './types'
import { EventBus, Listener, NoWorkflow } from '../../../domain/worker'

class WebSocketEventBus implements EventBus {
  #server: SocketServer
  #sockets: Map<string, Socket>

  constructor(options: ServerOptions) {
    this.#sockets = new Map()
    this.#server = new SocketServer(options.port)

    this.#server.on('connection', (socket) => {
      console.log('client connection', socket.id)
      this.#sockets.set(socket.id, socket)

      socket.on('disconnect', (reason) => {
        console.log(`socket ${socket.id} disconnected due to ${reason}`)
        this.#sockets.delete(socket.id)
      })
    })
  }

  on(eventName: string, listener: Listener): void {
    for (const socket of this.#sockets.values()) {
      console.log(`WebSocketEventBus::${socket.id}::listen **${eventName}**`)
      socket.on(eventName, listener)
    }
  }

  off(eventName: string) {
    for (const socket of this.#sockets.values()) {
      console.log(`WebSocketEventBus::${socket.id}::off ${eventName}`)
      socket.removeAllListeners(eventName)
    }
  }

  async send<Event>(eventName: string, event: Event): Promise<boolean> {
    try {
      await this.#server.timeout(1000).emitWithAck(eventName, event)
      return true
    } catch (e) {
      throw new NoWorkflow(eventName)
    }
  }

  async close() {
    return new Promise<void>((resolve, reject) =>
      this.#server.close((err) => {
        if (err) reject(err)
        else resolve()
      }),
    )
  }

  async waitUntilReady(): Promise<number> {
    const check = (resolve: (value: number) => void) => {
      if (this.#sockets.size > 0) {
        resolve(this.#sockets.size)
      } else {
        setTimeout(() => {
          check(resolve)
        }, 10)
      }
    }
    return new Promise(check)
  }
}

export { WebSocketEventBus }
