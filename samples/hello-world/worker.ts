import { createWorker } from '@workflow-runner/domain/worker'
import { workflow } from '@workflow-runner/domain/workflow'
import { createEventBus } from '@workflow-runner/infrastructure/bus/ws'

const WS_PORT = 4444

const greet = async (name: string): Promise<string> => {
  console.log('Execute the greet workflow', name)
  return `Hello, ${name}!`
}

const runWorker = async (): Promise<void> => {
  const url = `http://localhost:${WS_PORT}`
  const eventBus = createEventBus({ url })
  createWorker(eventBus)(workflow('Greet', greet))
}

runWorker().then(() => console.log('Greet worker is registered 👌'))
