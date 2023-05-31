import { createWorker } from '@workflow-runner/domain/worker'
import { workflow } from '@workflow-runner/domain/workflow'
import { createEventBus } from '@workflow-runner/infrastructure/bus/ws'

const WS_PORT = 4444

const failing = async (name: string): Promise<string> => {
  console.log('Execute the failing workflow', name)
  throw new Error('Oooouch!')
}

const runWorker = async (): Promise<void> => {
  const url = `http://localhost:${WS_PORT}`
  const eventBus = createEventBus({ url })
  createWorker(eventBus)(workflow('Greet', failing))
}

runWorker().then(() => console.log('Failing worker is registered 👌'))
