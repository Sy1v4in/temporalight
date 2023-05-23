import * as http from 'http'

import { WS_PORT } from './utils'
import { Logger } from '@workflow-runner/core/logger'
import { createEventBus } from '@workflow-runner/infrastructure/bus/ws'
import { workflowRepositoryManager } from '@workflow-runner/infrastructure/repository/mongo/workflow'
import * as app from '@workflow-runner/rest/api'

const startTemporalight = async (): Promise<http.Server> => {
  const logger: Logger = console
  const eventBus = createEventBus({ port: WS_PORT })
  const repositoryManager = await workflowRepositoryManager({
    url: 'mongodb://root:rootpass@0.0.0.0:27017',
  })
  const repository = repositoryManager.forWorkflow()

  return app.start({ logger, eventBus, repository })(app.create({ logger, eventBus, repository }))
}

startTemporalight().then(() => console.log('temporalight started ✅'))
