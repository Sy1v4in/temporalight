import { Handler } from '@tinyhttp/app'

import { Dependencies, StatusCode, WorkerBody } from './types'
import { BusinessError } from '../domain/errors'
import { createWorkerProxy } from '../domain/worker'

const runWorkflowHandler: (dep: Dependencies) => Handler = ({ logger, ...ports }) => {
  const workerProxy = createWorkerProxy(ports)
  return async (req, res) => {
    const worker: WorkerBody = req.body

    try {
      await workerProxy.start(worker)
      res.status(StatusCode.OK).send(`${worker.workflowName} started`)
    } catch (e) {
      if (e instanceof BusinessError) {
        res.status(StatusCode.BAD_REQUEST).send(e.message)
      } else {
        res.status(StatusCode.INTERNAL_ERROR).send('An internal error has occurred')
      }
    }
  }
}

export { runWorkflowHandler }
