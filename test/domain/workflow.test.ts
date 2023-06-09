import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { NoWorkflow } from '@workflow-runner/domain/errors'
import { EventBus, WorkflowRepository } from '@workflow-runner/domain/ports'
import { WorkerProxy } from '@workflow-runner/domain/types'
import { createWorker, createWorkerProxy } from '@workflow-runner/domain/worker'
import { workflow } from '@workflow-runner/domain/workflow'
import { InMemoryEventBus } from '@workflow-runner/infrastructure/bus/in-memory-event-bus'
import { createEventBus } from '@workflow-runner/infrastructure/bus/ws'
import { WebSocketEventBus } from '@workflow-runner/infrastructure/bus/ws/sever-event-bus'
import { InMemoryWorkflowRepository } from '@workflow-runner/infrastructure/repository/in-memory/workflow'

describe('Given a workflow nested in a worker', () => {
  const greet = async (name: string): Promise<string> => {
    console.log('Execute the greet workflow', name)
    return `Hello, ${name}!`
  }

  let eventBus: EventBus, repository: WorkflowRepository

  beforeEach(() => {
    repository = new InMemoryWorkflowRepository()
  })

  describe('with an in-memory event bus', () => {
    beforeEach(() => {
      eventBus = new InMemoryEventBus()
      createWorker(eventBus)(workflow('Greet', greet))
    })

    describe('the worker proxy runner', () => {
      let workerProxy: WorkerProxy

      beforeEach(() => {
        workerProxy = createWorkerProxy({ eventBus, repository })
      })

      it('should return the workflow started status when starting', async () => {
        const isWorkflowStarted = await workerProxy.start({
          workflowName: 'Greet',
          workflowId: '123',
          payload: 'Jane Doe',
        })

        assert.strictEqual(isWorkflowStarted, true)
      })

      it('should throw a NoWorkflow error when starting without workflow', async () => {
        await assert.rejects(
          async () =>
            workerProxy.start({
              workflowName: 'UnregisteredWorkflowName',
              workflowId: '123',
              payload: 'Jane Doe',
            }),
          (err: Error) => {
            assert.ok(err instanceof NoWorkflow)
            assert.strictEqual(
              err.message,
              'There are no workflows registered with name "UnregisteredWorkflowName"',
            )
            return true
          },
        )
      })
    })
  })

  describe('with a websocket event bus', () => {
    const port = 1234
    let workerEventBus: EventBus

    beforeEach(() => {
      workerEventBus = createEventBus({ url: `http://localhost:${port}` })
      createWorker(workerEventBus)(workflow('Greet', greet))

      eventBus = createEventBus({ port })
    })

    afterEach(async () => {
      await workerEventBus.close()
      await eventBus.close()
    })

    it('should throw a NoWorkflow error when starting without any workflow', async () => {
      await assert.rejects(
        async () => eventBus.send('Greet', 'Jane Doe'),
        (err: Error) => {
          assert.ok(err instanceof NoWorkflow)
          assert.strictEqual(err.message, 'There are no workflows registered with name "Greet"')
          return true
        },
      )
    })

    describe('the worker proxy runner', () => {
      let workerProxy: WorkerProxy

      beforeEach(async () => {
        workerProxy = createWorkerProxy({ eventBus, repository })
        await (eventBus as WebSocketEventBus).waitUntilReady()
      })

      it('should return the workflow started status when starting', async () => {
        const isWorkflowStarted = await workerProxy.start({
          workflowName: 'Greet',
          workflowId: '123',
          payload: 'Jane Doe',
        })

        assert.strictEqual(isWorkflowStarted, true)
      })

      it('should throw a NoWorkflow error when starting without workflow', async () => {
        await assert.rejects(
          async () =>
            workerProxy.start({
              workflowName: 'UnregisteredWorkflowName',
              workflowId: '123',
              payload: 'Jane Doe',
            }),
          (err: Error) => {
            assert.ok(err instanceof NoWorkflow)
            assert.strictEqual(
              err.message,
              'There are no workflows registered with name "UnregisteredWorkflowName"',
            )
            return true
          },
        )
      })
    })
  })
})
