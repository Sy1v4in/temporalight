import { Nullable } from '../core/types'

export type Listener = (...arg: any[]) => any

export type EventBus = {
  on: (eventName: string, listener: Listener) => void
  off: (eventName: string) => void
  send: <Event = unknown>(eventName: string, event: Event) => Promise<boolean>
  close: () => Promise<void>
}

export type RuntimeStatus = 'UNINITIALIZED' | 'STARTED' | 'SUCCEED' | 'RETRY' | 'FAILED'

export type UninitializedWorkflowRuntime = {
  name: string
  id: string
  status: 'UNINITIALIZED'
}

export type StartedWorkflowRuntime = {
  name: string
  id: string
  status: 'STARTED'
}

export type SucceedWorkflowRuntime<T = unknown> = {
  name: string
  id: string
  status: 'SUCCEED'
  result: T
}

export type FailedWorkflowRuntime<E extends Error = Error> = {
  name: string
  id: string
  status: 'FAILED'
  error: E
}

export type RetryWorkflowRuntime<E extends Error = Error> = {
  name: string
  id: string
  status: 'RETRY'
  error: E
  retryCount: number
}

export type WorkflowRuntime<T = unknown, E extends Error = Error> =
  | UninitializedWorkflowRuntime
  | StartedWorkflowRuntime
  | SucceedWorkflowRuntime<T>
  | FailedWorkflowRuntime<E>
  | RetryWorkflowRuntime<E>

export const isRetry = (workflow: WorkflowRuntime): workflow is RetryWorkflowRuntime =>
  workflow.status === 'RETRY'

export type WorkflowRepository = {
  save: (workflowRuntime: WorkflowRuntime) => Promise<void>
  find: (workflowRuntimeId: string) => Promise<Nullable<WorkflowRuntime>>
}

export type Ports = {
  eventBus: EventBus
  repository: WorkflowRepository
}

export type RetryStrategy = (tryCount: number) => number

export type Options = {
  retry?: boolean | RetryStrategy
}
