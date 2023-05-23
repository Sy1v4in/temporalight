export class NoWorkflow extends Error {
  constructor(workflowName: string) {
    super(`There are no workflows registered with name "${workflowName}"`)
  }
}

export class AlreadyExistingWorkflow extends Error {
  constructor(workflowId: string) {
    super(`Workflow "${workflowId}" has already been executed`)
  }
}
