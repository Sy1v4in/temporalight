import { Logger } from '../core/logger'
import { Ports } from '../domain/ports'
import { WorkerPayload } from '../domain/types'

export type Dependencies = Ports & {
  logger: Logger
}

export type WorkerBody<P = unknown> = WorkerPayload<P>

export enum StatusCode {
  BAD_REQUEST = 400,
  INTERNAL_ERROR = 500,
  OK = 200,
}
