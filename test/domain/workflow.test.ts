import * as assert from 'assert'
import { beforeEach, describe, it } from 'node:test'

import {
  createWorker,
  createWorkerProxy,
  EventBus,
  WorkerProxy,
} from '@workflow-runner/domain/worker'
import { workflow } from '@workflow-runner/domain/workflow'
import { InMemoryEventBus } from '@workflow-runner/infrastructure/bus/in-memory-event-bus'

describe('Given a workflow nested in a worker', () => {
  const greet = async (name: string): Promise<string> => {
    console.log('Execute the greet workflow', name)
    return `Hello, ${name}!`
  }

  let eventBus: EventBus

  describe('with an in-memory event bus', () => {
    beforeEach(() => {
      eventBus = new InMemoryEventBus()
      createWorker(eventBus)(workflow('Greet', greet))
    })

    describe('the worker proxy runner', () => {
      let workerProxy: WorkerProxy

      beforeEach(() => {
        workerProxy = createWorkerProxy(eventBus)
      })

      it('should return the workflow result when running', async () => {
        const workflowResult = await workerProxy.run({
          workflowName: 'Greet',
          workflowId: '123',
          payload: 'Jane Doe',
        })

        assert.strictEqual(workflowResult, 'Hello, Jane Doe!')
      })

      it('should return the workflow started status when starting', async () => {
        const isWorkflowStarted = await workerProxy.start({
          workflowName: 'Greet',
          workflowId: '123',
          payload: 'Jane Doe',
        })

        assert.strictEqual(isWorkflowStarted, true)
      })

      it('should return the workflow NOT started result when starting without workflow', async () => {
        const isWorkflowStarted = await workerProxy.start({
          workflowName: 'UnregisteredWorkflowName',
          workflowId: '123',
          payload: 'Jane Doe',
        })

        assert.strictEqual(isWorkflowStarted, false)
      })
    })
  })
})
