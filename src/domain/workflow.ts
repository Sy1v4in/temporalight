export interface Workflow<Payload = unknown, Response = unknown> {
  name: string
  run: (args: Payload) => Promise<Response>
}

const workflow = <Payload = unknown, Response = unknown>(
  workflowName: string,
  func: (payload: Payload) => Promise<Response>,
): Workflow<Payload, Response> => ({
  name: workflowName,
  run: func,
})

export { workflow }
