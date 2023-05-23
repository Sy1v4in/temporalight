import { WorkerPayload, WorkerProxy, Workflow } from './types'
import { EventBus } from '@workflow-runner/domain/ports'


const runtimeId = (worker: WorkerPayload): string => `${worker.workflowName}:${worker.workflowId}`

const createWorker =
  (eventBus: EventBus) =>
  <Payload = unknown, Response = unknown>(workflow: Workflow<Payload, Response>): void => {
    eventBus.on(workflow.name, async (worker: WorkerPayload<Payload>) => {
      const workflowId = runtimeId(worker)
      await eventBus.send(workflowId, { status: 'START' })
      try {
        const result = await workflow.run(worker.payload)
        await eventBus.send(workflowId, { status: 'SUCCEED', result })
      } catch (error) {
        await eventBus.send(workflowId, { status: 'FAIL', error })
      }
    })
  }

const createWorkerProxy = (eventBus: EventBus): WorkerProxy => {
  return {
    start: executeWorkflow(eventBus, false),
    run: executeWorkflow(eventBus, true),
  }
}

const executeWorkflow =
  (eventBus: EventBus, waitForResult: boolean) => (workerPayload: WorkerPayload) =>
    new Promise((resolve, reject) => {
      const workflowId = runtimeId(workerPayload)
      eventBus.on(workflowId, (runtime) => {
        switch (runtime.status) {
          case 'STARTED':
            break
          case 'SUCCEED':
            eventBus.off(workflowId)
            if (waitForResult) resolve(runtime.result)
            break
          case 'FAIL':
            eventBus.off(workflowId)
            if (waitForResult) reject(runtime.error)
        }
      })

      eventBus
        .send(workerPayload.workflowName, workerPayload)
        .then((response) => {
          if (!waitForResult) resolve(response)
        })
        .catch(reject)
    })

export { createWorker, createWorkerProxy }
