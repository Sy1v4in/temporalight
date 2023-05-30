import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'

import {
  StartedWorkflowRuntime,
  SucceedWorkflowRuntime,
  WorkflowRepository,
  WorkflowRuntime,
} from '@workflow-runner/domain/ports'
import {
  RepositoryManager,
  workflowRepositoryManager,
} from '@workflow-runner/infrastructure/repository/mongo/workflow'

describe('Mongo Workflow Repository', () => {
  let repositoryManager: RepositoryManager
  let repository: WorkflowRepository

  before(async () => {
    repositoryManager = await workflowRepositoryManager({
      url: 'mongodb://root:rootpass@0.0.0.0:27017',
    })
    repository = repositoryManager.forWorkflow()
  })

  beforeEach(async () => {
    await repositoryManager.dropAll()
  })

  after(async () => {
    await repositoryManager.close()
  })

  it('should return null if a workflow does not exist', async () => {
    const workflow = await repository.find('Hello:world')
    assert.equal(workflow, null)
  })

  it('should return persisted workflow', async () => {
    const workflow: WorkflowRuntime = { name: 'Greet', id: 'Greet:123', status: 'STARTED' }
    await repository.save(workflow)

    const savedWorkflow = await repository.find(workflow.id)

    assert.deepStrictEqual(savedWorkflow, workflow)
  })

  it('should update the information when saving the workflow runtime many times', async () => {
    const workflow: StartedWorkflowRuntime = { name: 'Hello', id: 'Hello:123', status: 'STARTED' }
    await repository.save(workflow)

    const succeedWorkflow: SucceedWorkflowRuntime = { ...workflow, status: 'SUCCEED', result: 'Ok' }
    await repository.save(succeedWorkflow)

    const savedWorkflow = await repository.find(workflow.id)

    assert.strictEqual(savedWorkflow?.status, 'SUCCEED')
  })
})
