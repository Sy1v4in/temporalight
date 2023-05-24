import * as http from 'http'

import { App } from '@tinyhttp/app'
import * as bodyParser from 'milliparsec'

import { Dependencies } from './types'
import { runWorkflowHandler } from './workflow-handler'

const httPort = parseInt(process.env.HTTP_PORT ?? '3333')

const create = ({ logger, eventBus, repository }: Dependencies): App =>
  new App()
    .use(bodyParser.json())
    .post('/workflows', runWorkflowHandler({ logger, eventBus, repository }))

const start =
  ({ logger }: Dependencies) =>
  (application: App): http.Server =>
    application
      .listen(httPort)
      .on('listening', () => logger.info(`Http server started on port ${httPort}`))

export { create, start }
