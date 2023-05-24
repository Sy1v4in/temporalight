import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import { AlreadyExistingWorkflow } from '@workflow-runner/domain/errors'
import { EventBus, WorkflowRepository } from '@workflow-runner/domain/ports'
import { WorkerProxy } from '@workflow-runner/domain/types'
import { createWorker, createWorkerProxy } from '@workflow-runner/domain/worker'
import { workflow } from '@workflow-runner/domain/workflow'
import { InMemoryEventBus } from '@workflow-runner/infrastructure/bus/in-memory-event-bus'
import { InMemoryWorkflowRepository } from '@workflow-runner/infrastructure/repository/in-memory/workflow'

describe('Given a worker', () => {
  const greet = async (name: string): Promise<string> => {
    console.log('Execute the greet workflow', name)
    return `Hello, ${name}!`
  }

  let eventBus: EventBus, repository: WorkflowRepository

  describe('with an in-memory event bus', () => {
    beforeEach(() => {
      eventBus = new InMemoryEventBus()
      repository = new InMemoryWorkflowRepository()
      createWorker(eventBus)(workflow('Greet', greet))
    })

    describe('the proxy runner', () => {
      let workerProxy: WorkerProxy

      beforeEach(() => {
        workerProxy = createWorkerProxy({ eventBus, repository })
      })

      it('should throw an AlreadyExistingWorkflow error when starting a workflow 2 times', async () => {
        await workerProxy.start({
          workflowName: 'Greet',
          workflowId: '123',
          payload: 'Jane Doe',
        })

        await assert.rejects(
          async () =>
            workerProxy.start({
              workflowName: 'Greet',
              workflowId: '123',
              payload: 'Jane Doe',
            }),
          (err: Error) => {
            assert.ok(err instanceof AlreadyExistingWorkflow)
            assert.strictEqual(err.message, 'Workflow "Greet:123" has already been executed')
            return true
          },
        )
      })
    })
  })
})
