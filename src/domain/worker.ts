import { Workflow } from './workflow'

export type Listener = (arg: any) => any

export type EventBus = {
  on: (eventName: string, listener: Listener) => void
  off: (eventName: string) => void
  send: <Event = unknown>(eventName: string, event: Event) => Promise<boolean>
  close: () => Promise<void>
}

export type WorkerPayload<Payload = unknown> = {
  workflowName: string
  workflowId: string
  payload: Payload
}

export type WorkerProxy = {
  start: (workerPayload: WorkerPayload) => Promise<unknown>
  run: (workerPayload: WorkerPayload) => Promise<unknown>
}

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

      const response = eventBus.send(workerPayload.workflowName, workerPayload)
      if (!waitForResult) resolve(response)
    })

export { createWorker, runtimeId, createWorkerProxy }
