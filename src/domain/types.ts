export type WorkflowLifecycle = 'SUCCESS' | 'FAIL'

export type WorkflowCallback<T = unknown> = (result: T) => Promise<void>

export type Worker = {
  on: (lifecycle: WorkflowLifecycle, callback: WorkflowCallback) => Worker
}

export interface Workflow<Payload = unknown, Response = unknown> {
  name: string
  run: (args: Payload) => Promise<Response>
}

export type WorkerPayload<Payload = unknown> = {
  workflowName: string
  workflowId: string
  payload: Payload
}

export type WorkerProxy = {
  start: (workerPayload: WorkerPayload) => Promise<unknown>
}
