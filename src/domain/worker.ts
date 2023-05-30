import {
  Worker,
  WorkerPayload,
  WorkerProxy,
  Workflow,
  WorkflowCallback,
  WorkflowLifecycle,
} from './types'
import { wait } from '../core/utils'
import { AlreadyExistingWorkflow } from '../domain/errors'
import {
  EventBus,
  FailedWorkflowRuntime,
  isRetry,
  Options,
  Ports,
  RetryStrategy,
  SucceedWorkflowRuntime,
  WorkflowRepository,
  WorkflowRuntime,
} from '../domain/ports'

const runtimeId = (worker: WorkerPayload): string => `${worker.workflowName}:${worker.workflowId}`

const createWorker =
  (eventBus: EventBus) =>
  <Payload = unknown, Response = unknown>(workflow: Workflow<Payload, Response>): Worker => {
    const listeners: Map<WorkflowLifecycle, WorkflowCallback[]> = new Map()

    const executeCallbacks = async <T = unknown>(
      lifecycle: WorkflowLifecycle,
      result: T,
    ): Promise<void> => {
      await Promise.all(
        (listeners.get(lifecycle) || []).map(async (callback) => {
          try {
            await callback(result)
          } catch (e) {
            console.error(`on${lifecycle}::callback error`, e)
          }
        }),
      )
    }

    eventBus.on(workflow.name, async (worker: WorkerPayload<Payload>) => {
      const workflowId = runtimeId(worker)
      await eventBus.send(workflowId, { status: 'START' })
      try {
        const result = await workflow.run(worker.payload)
        await eventBus.send(workflowId, { status: 'SUCCEED', result })
        await executeCallbacks('SUCCESS', result)
      } catch (error) {
        await eventBus.send(workflowId, { status: 'FAILED', error })
        await executeCallbacks('FAIL', error)
      }
    })

    const worker: Worker = {
      on: (lifecycle, callback) => {
        const callbacks = listeners.get(lifecycle) || []
        listeners.set(lifecycle, [...callbacks, callback])
        return worker
      },
    }
    return worker
  }

const createWorkerProxy = (ports: Ports, options: Options = {}): WorkerProxy => ({
  start: executeWorkflow(ports, options),
})

const startWorkflow = (eventBus: EventBus) => async (workerPayload: WorkerPayload) =>
  eventBus.send(workerPayload.workflowName, workerPayload)

const executeWorkflow =
  ({ eventBus, repository }: Ports, options: Options) =>
  async (workerPayload: WorkerPayload) => {
    const workflowId = runtimeId(workerPayload)

    const existingWorkflow = await repository.find(workflowId)
    if (existingWorkflow) throw new AlreadyExistingWorkflow(workflowId)

    await repository.save({
      name: workerPayload.workflowName,
      id: workflowId,
      status: 'UNINITIALIZED',
    })

    listenToSaveResult({ eventBus, repository })(workerPayload, options)

    return startWorkflow(eventBus)(workerPayload)
  }

const listenToSaveResult =
  ({ eventBus, repository }: Ports) =>
  (workerPayload: WorkerPayload, { retry }: Options) => {
    const workflowId = runtimeId(workerPayload)
    eventBus.on(workflowId, async (runtime: WorkflowRuntime) => {
      const save = workflowRepository(repository, workflowId)
      switch (runtime.status) {
        case 'SUCCEED':
          await save.success(runtime)
          eventBus.off(workflowId)
          break
        case 'FAILED':
          if (!retry) {
            await save.fail(runtime)
            eventBus.off(workflowId)
          } else {
            const retryStrategy = retry === true ? exponentialRetryStrategy() : retry
            const existingWorkflow = await repository.find(workflowId)
            const retryCount =
              existingWorkflow && isRetry(existingWorkflow) ? existingWorkflow.retryCount : 0
            const delayBeforeTheNextRetry = retryStrategy(retryCount)
            if (delayBeforeTheNextRetry > 0) {
              await save.retry(runtime, retryCount)
              await wait(delayBeforeTheNextRetry)
              await startWorkflow(eventBus)(workerPayload)
            } else {
              eventBus.off(workflowId)
              await save.fail(runtime)
            }
          }
      }
    })
  }

const exponentialRetryStrategy =
  ({
    maxRetries = 7,
    initialDelay = 500,
  }: {
    maxRetries?: number
    initialDelay?: number
  } = {}): RetryStrategy =>
  (retryCount) =>
    retryCount < maxRetries ? initialDelay * Math.pow(2, retryCount) : -1

const workflowRepository = (repository: WorkflowRepository, workflowId: string) => {
  const success = async (runtime: SucceedWorkflowRuntime) => {
    await repository.save({
      name: runtime.name,
      id: workflowId,
      status: 'SUCCEED',
      result: runtime.result,
    })
  }

  const fail = async (runtime: FailedWorkflowRuntime) => {
    await repository.save({
      name: runtime.name,
      id: workflowId,
      status: 'FAILED',
      error: runtime.error,
    })
  }

  const retry = async (runtime: FailedWorkflowRuntime, retryCount: number) => {
    await repository.save({
      name: runtime.name,
      id: workflowId,
      status: 'RETRY',
      error: runtime.error,
      retryCount: retryCount + 1,
    })
  }
  return {
    fail,
    retry,
    success,
  }
}

export { createWorker, createWorkerProxy }
