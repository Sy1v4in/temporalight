import { WorkflowRepository, WorkflowRuntime } from '../../../domain/ports'

class InMemoryWorkflowRepository implements WorkflowRepository {
  #register: Map<string, WorkflowRuntime>

  constructor() {
    this.#register = new Map()
  }

  async save(workflowRuntime: WorkflowRuntime) {
    this.#register.set(workflowRuntime.id, workflowRuntime)
  }

  async find(workflowId: string) {
    return this.#register.get(workflowId) || null
  }
}

export { InMemoryWorkflowRepository }
