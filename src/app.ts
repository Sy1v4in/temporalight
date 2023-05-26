import * as http from 'http'

import { Logger } from './core/logger'
import { createEventBus } from './infrastructure/bus/ws'
import { workflowRepositoryManager } from './infrastructure/repository/mongo/workflow'
import * as app from './rest/api'

const WS_PORT = Number(process.env.WS_PORT || '4444')
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://root:rootpass@0.0.0.0:27017'

const startTemporalight = async (): Promise<http.Server> => {
  const logger: Logger = console
  const eventBus = createEventBus({ port: WS_PORT })
  const repositoryManager = await workflowRepositoryManager({
    url: MONGODB_URL,
  })
  const repository = repositoryManager.forWorkflow()

  const dependencies = { logger, eventBus, repository }
  return app.start(dependencies)(app.create(dependencies))
}

startTemporalight().then(() => console.log('Temporalight started ✅'))
