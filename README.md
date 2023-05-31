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
To do that, `temporalight` provides an event bus concept that could work remotely through the network. 

From a client point of view, the `node` process where the workflow is executed, the event bus is created with a supplied
full url:
```typescript
import { createWorker } from '@workflow-runner/domain/worker'
import { workflow } from '@workflow-runner/domain/workflow'
import { createEventBus } from '@workflow-runner/infrastructure/bus/ws'

const eventBus = createEventBus({ url: 'htto://localhost:4444' })
createWorker(eventBus)(workflow('Greet', greet))

```

You can find this example in the `samples/hello-word` directory.

A retry strategy is also available. Using a retry strategy it is possible to restart a workflow that has failed.
For now, the retry strategy is defined at the server handler. For later, we can imagine to override the strategy at the
worker level.
The default retry strategy is a simple exponential strategy, increasing the waiting time between retries up to a
maximum backoff time.
This algorithm could be changed when creating the workerProxy. The strategy is just a function that computes the delay
before the next retry. To stop to retry running the workflow, the retry strategy function has to return -1.
In this case, the workflow result is considered a fail.


### Run the application server

From a server point of view, where the workflow is registered, the event bus is just created using the port through which
clients and server will communicate. This event bus is then used in the http server handler.
It is also needed to start a `mongodb` server to persist the workflow information.
To simplify this technical part, a `Dockerfile` is provided where `docker-compose` files and scripts to use them.
Then, 
  - to start the application server with the persistence system, you can simplify call the
`.local/bin/run-app`
  - to stop these servers, just call the `.local/bin/run-app stop`
  - during the application server run, it is possible to see the logs calling `.local/bin/show-logs` script

If you want to start the application server with the `mongodb` by yourself, you have to start a `mongodb` server and,
at least, install the production dependencies before running the app with `node`:
```shell
MONGODB_URL=<your server URL> npm run start:dev ./src/app
```

### Tests

If you want to run the unit tests, you also need a `mongodb` server to test the Workflow Repository implementation
through `mongodb`. The easiest way is to use `docker` through the `.local/bin/run-db` script 
that runs a `mongodb` server; the tests are configured to work with it. Then, just run the classical
`npm test`.
