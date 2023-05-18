import { WebSocketEventBus } from './sever-event-bus'
import { Options, ServerOptions } from './types'
import { WebSocketClientEventBus } from './worker-event-bus'

const isServerOptions = (options: Options): options is ServerOptions =>
  !!(options as ServerOptions).port

const createEventBus = (options: Options) => {
  if (isServerOptions(options)) {
    return new WebSocketEventBus(options)
  }
  return new WebSocketClientEventBus(options)
}

export { createEventBus }
