import { Workflow } from './types'

const workflow = <Payload = unknown, Response = unknown>(
  workflowName: string,
  func: (payload: Payload) => Promise<Response>,
): Workflow<Payload, Response> => ({
  name: workflowName,
  run: func,
})

export { workflow }
