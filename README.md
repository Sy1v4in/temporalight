# `temporalight`

`temporalight` is a simple `workflow` runner.

## Installation

For now, the simplest way to test this app is to clone the repository with `node` installed.
The recommended way to install `node` is to use [`nvm`](https://github.com/nvm-sh/nvm) and
using the version defined in the `.nvmrc` file.

Once the right version installed, run the dependencies with the `npm ci` command.


## Usage

A `workflow` is just a function that executes some code and returns a result. It should be idempotent,
A `workflow` has a name that references the code that is meant to be executed.
 
For instance, having a simple function as:
```typescript
const greet = async (name: string): Promise<string> => {
  console.log('Execute the greet workflow', name)
  return `Hello, ${name}!`
}
```

It is possible to create a `workflow` for this function `workflow('Greet', greet)` with `'Greet'` as name using the 
`workflow` function from the `@workflow-runner/domain/workflow` module.

For simplicity reasons a workflow should be able to be triggered via a network request like this and should respond
with the result of the workflow.
To do that, `temporalight` provides an event bus concept that could be worked remotely through the network. 

From a client point of view, the node process where the workflow is executed, the event bus is created with a supplied full url:
```typescript
import { createWorker } from '@workflow-runner/domain/worker'
import { workflow } from '@workflow-runner/domain/workflow'
import { createEventBus } from '@workflow-runner/infrastructure/bus/ws'

const eventBus = createEventBus({ url: 'htto://localhost:4444' })
createWorker(eventBus)(workflow('Greet', greet))

```

From a server point of view, where the workflow is registered, the event bus is just created using the port through which
clients and server will communicate. This event bus is then used in the http server handler:
```typescript
import { createEventBus } from '@workflow-runner/infrastructure/bus/ws'
import * as app from '@workflow-runner/rest/api'

const eventBus = createEventBus({ port: 4444 })
app.start({ eventBus })(app.create({ eventBus }))

```

You can find this example in the `samples/hello-word` directory.
