import { Handler } from '@tinyhttp/app'

import { Dependencies, StatusCode, WorkerBody } from './types'
import { createWorkerProxy, NoWorkflow } from '@workflow-runner/domain/worker'

const runWorkflowHandler: (dep: Dependencies) => Handler = ({ eventBus }) => {
  const workerProxy = createWorkerProxy(eventBus)
  return async (req, res) => {
    const worker: WorkerBody = req.body

    try {
      await workerProxy.start(worker)
      res.status(StatusCode.OK).send(`${worker.workflowName} started`)
    } catch (e) {
      if (e instanceof NoWorkflow) {
        res.status(StatusCode.BAD_REQUEST).send(e.message)
      } else {
        res.status(StatusCode.INTERNAL_ERROR).send('An internal error has occurred')
      }
    }
  }
}

export { runWorkflowHandler }
