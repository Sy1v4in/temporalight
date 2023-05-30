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
const createWorkerProxy = (ports: Ports): WorkerProxy => ({
  start: executeWorkflow(ports),
})

const startWorkflow = (eventBus: EventBus) => async (workerPayload: WorkerPayload) =>
  eventBus.send(workerPayload.workflowName, workerPayload)

const executeWorkflow =
  ({ eventBus, repository }: Ports) =>
  async (workerPayload: WorkerPayload) => {
    const workflowId = runtimeId(workerPayload)

    const existingWorkflow = await repository.find(workflowId)
    if (existingWorkflow) throw new AlreadyExistingWorkflow(workflowId)

    await repository.save({
      name: workerPayload.workflowName,
      id: workflowId,
      status: 'UNINITIALIZED',
    })

    listenToSaveResult({ eventBus, repository })(workerPayload)

    return startWorkflow(eventBus)(workerPayload)
  }

const listenToSaveResult =
  ({ eventBus, repository }: Ports) =>
  (workerPayload: WorkerPayload) => {
    const workflowId = runtimeId(workerPayload)
    eventBus.on(workflowId, async (runtime: WorkflowRuntime) => {
      const save = workflowRepository(repository, workflowId)
      switch (runtime.status) {
        case 'SUCCEED':
          await save.success(runtime)
          eventBus.off(workflowId)
          break
        case 'FAILED':
          await save.fail(runtime)
          eventBus.off(workflowId)
      }
    })
  }

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
    })
  }
  return {
    fail,
    success,
  }
}

export { createWorker, createWorkerProxy }
