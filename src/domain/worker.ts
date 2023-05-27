import { WorkerPayload, WorkerProxy, Workflow } from './types'
import { AlreadyExistingWorkflow } from '../domain/errors'
import { EventBus, Ports } from '../domain/ports'

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
        await eventBus.send(workflowId, { status: 'FAILED', error })
      }
    })
  }

const createWorkerProxy = (ports: Ports): WorkerProxy => {
  return {
    start: executeWorkflow(ports, false),
    run: executeWorkflow(ports, true),
  }
}

const executeWorkflow =
  ({ eventBus, repository }: Ports, waitForResult: boolean) =>
  (workerPayload: WorkerPayload) =>
    new Promise((resolve, reject) => {
      const workflowId = runtimeId(workerPayload)
      repository
        .find(workflowId)
        .then((existingWorkflow) => {
          if (existingWorkflow) throw new AlreadyExistingWorkflow(workflowId)

          eventBus.on(workflowId, (runtime) => {
            let applyResolve = () => {
              /* no op*/
            }
            switch (runtime.status) {
              case 'SUCCEED':
                applyResolve = () => waitForResult && resolve(runtime.result)
                eventBus.off(workflowId)
                break
              case 'FAILED':
                applyResolve = () => waitForResult && reject(runtime.error)
                eventBus.off(workflowId)
            }
            repository
              .save({
                name: workerPayload.workflowName,
                id: workflowId,
                status: runtime.status,
              })
              .then(applyResolve)
          })

          eventBus
            .send(workerPayload.workflowName, workerPayload)
            .then((response) => {
              if (!waitForResult) resolve(response)
            })
            .catch(reject)
        })
        .catch(reject)
    })

export { createWorker, createWorkerProxy }
