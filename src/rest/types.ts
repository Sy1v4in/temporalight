import { Logger } from '../core/logger'
import { EventBus, WorkerPayload } from '../domain/worker'

export type Dependencies = {
  logger: Logger
  eventBus: EventBus
}

export type WorkerBody<P = unknown> = WorkerPayload<P>

export enum StatusCode {
  BAD_REQUEST = 400,
  INTERNAL_ERROR = 500,
  OK = 200,
}
