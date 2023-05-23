export class BusinessError extends Error {}

export class NoWorkflow extends BusinessError {
  constructor(workflowName: string) {
    super(`There are no workflows registered with name "${workflowName}"`)
  }
}

export class AlreadyExistingWorkflow extends BusinessError {
  constructor(workflowId: string) {
    super(`Workflow "${workflowId}" has already been executed`)
  }
}
