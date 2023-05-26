import { Nullable } from '../core/types'

export type Listener = (...arg: any[]) => any

export type EventBus = {
  on: (eventName: string, listener: Listener) => void
  off: (eventName: string) => void
  send: <Event = unknown>(eventName: string, event: Event) => Promise<boolean>
  close: () => Promise<void>
}

export type RuntimeStatus = 'UNINITIALIZED' | 'STARTED' | 'SUCCEED' | 'FAILED'

export type WorkflowRuntime = {
  name: string
  id: string
  status: RuntimeStatus
}

export type WorkflowRepository = {
  save: (workflowRuntime: WorkflowRuntime) => Promise<void>
  find: (workflowRuntimeId: string) => Promise<Nullable<WorkflowRuntime>>
}

export type Ports = {
  eventBus: EventBus
  repository: WorkflowRepository
}
