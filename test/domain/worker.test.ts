import assert from 'node:assert/strict'
import { beforeEach, describe, it, test } from 'node:test'

import { AlreadyExistingWorkflow } from '@workflow-runner/domain/errors'
import { EventBus, WorkflowRepository } from '@workflow-runner/domain/ports'
import { Worker, WorkerProxy } from '@workflow-runner/domain/types'
import { createWorker, createWorkerProxy } from '@workflow-runner/domain/worker'
import { workflow } from '@workflow-runner/domain/workflow'
import { InMemoryEventBus } from '@workflow-runner/infrastructure/bus/in-memory-event-bus'
import { InMemoryWorkflowRepository } from '@workflow-runner/infrastructure/repository/in-memory/workflow'

describe('Given a worker', () => {
  let eventBus: EventBus, repository: WorkflowRepository

  describe('with an in-memory event bus', () => {
    beforeEach(() => {
      eventBus = new InMemoryEventBus()
      repository = new InMemoryWorkflowRepository()
    })

    describe('the proxy runner without retry', () => {
      let worker: Worker, workerProxy: WorkerProxy

      beforeEach(() => {
        workerProxy = createWorkerProxy({ eventBus, repository })
      })

      describe('for a successful workflow', () => {
        const greet = async (name: string): Promise<string> => {
          return `Hello, ${name}!`
        }

        beforeEach(() => {
          worker = createWorker(eventBus)(workflow('Greet', greet))
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

        test('should save the workflow with the SUCCEED status', (_, done) => {
          const name = 'John Doe'

          worker
            .on('FAIL', async () => {
              done('This workflow should have succeed')
            })
            .on('SUCCESS', async (result) => {
              assert.strictEqual(result, `Hello, ${name}!`)
              done()
            })

          workerProxy.start({
            workflowName: 'Greet',
            workflowId: 'abc',
            payload: name,
          })
        })
      })

      describe('for a failing workflow', () => {
        const failing = async (name: string): Promise<string> => {
          throw new Error(`Oh no!!! ${name}!`)
        }

        beforeEach(() => {
          worker = createWorker(eventBus)(workflow('Failing', failing))
        })

        test('should save the workflow with the FAILED status', (_, done) => {
          const arg = 'Arg'

          worker
            .on('FAIL', async (result) => {
              assert.deepEqual(result, new Error(`Oh no!!! ${arg}!`))
              done()
            })
            .on('SUCCESS', async () => {
              done('This workflow should have failed')
            })

          workerProxy.start({
            workflowName: 'Failing',
            workflowId: 'abc',
            payload: arg,
          })
        })
      })
    })

    describe('the proxy runner with a retry strategy', () => {
      let worker: Worker, workerProxy: WorkerProxy

      beforeEach(() => {
        workerProxy = createWorkerProxy({ eventBus, repository }, { retry: true })
      })

      describe('for an unstable workflow', () => {
        let tryCount = 0

        const unstable = async (success: string): Promise<string> => {
          if (tryCount < 3) {
            tryCount += 1
            throw new Error(`Oh no!!! ${tryCount}!`)
          }
          return `Oh yeah! ${success}`
        }

        beforeEach(() => {
          worker = createWorker(eventBus)(workflow('Unstable', unstable))
        })

        test('should save the workflow with the FAILED status', (_, done) => {
          const successValue = 'Bravo'

          worker
            .on('FAIL', async () => {
              if (tryCount > 3) {
                done('This workflow should have succeed after 3 tries')
              }
            })
            .on('SUCCESS', async (result) => {
              assert.strictEqual(result, `Oh yeah! ${successValue}`)
              done()
            })

          workerProxy.start({
            workflowName: 'Unstable',
            workflowId: '123',
            payload: successValue,
          })
        })
      })
    })
  })
})
