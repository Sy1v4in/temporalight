import * as http from 'http'

import { WS_PORT } from './utils'
import { Logger } from '@workflow-runner/core/logger'
import { createEventBus } from '@workflow-runner/infrastructure/bus/ws'
import * as app from '@workflow-runner/rest/api'

const startTemporalight = async (): Promise<http.Server> => {
  const logger: Logger = console
  const eventBus = createEventBus({ port: WS_PORT })
  return app.start({ logger, eventBus })(app.create({ logger, eventBus }))
}

startTemporalight().then(() => console.log('temporalight started ✅'))
