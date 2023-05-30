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
