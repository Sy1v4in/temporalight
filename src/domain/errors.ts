export class NoWorkflow extends Error {
  constructor(workflowName: string) {
    super(`There are no workflows registered with name "${workflowName}"`)
  }
}
