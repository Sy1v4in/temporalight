import { Collection, Db, MongoClient } from 'mongodb'

import { WorkflowRepository, WorkflowRuntime } from '../../../domain/ports'

class MongoWorkflowRepository implements WorkflowRepository {
  #workflows: Collection<WorkflowRuntime>

  constructor(db: Db) {
    this.#workflows = db.collection<WorkflowRuntime>('workflows')
  }

  async save(workflowRuntime: WorkflowRuntime) {
    const { matchedCount } = await this.#workflows.replaceOne(
      { id: workflowRuntime.id },
      workflowRuntime,
    )
    if (matchedCount === 0) {
      await this.#workflows.insertOne(workflowRuntime)
    }
  }

  find(workflowRuntimeId: string) {
    return this.#workflows.findOne({ id: workflowRuntimeId })
  }
}

export type Options = {
  url: string
  dbName?: string
}

export type RepositoryManager = {
  forWorkflow: () => WorkflowRepository
  dropAll: () => Promise<void>
  close: () => Promise<void>
}

const workflowRepositoryManager = async ({
  url,
  dbName = 'temporalight',
}: Options): Promise<RepositoryManager> => {
  const client = new MongoClient(url, {
    tls: false,
    ssl: false,
    connectTimeoutMS: 1000,
  })
  await client.connect()
  const db = client.db(dbName)

  return {
    forWorkflow: () => new MongoWorkflowRepository(db),

    close: () => client.close(),

    dropAll: async () => {
      const collections = await db.listCollections().toArray()
      await Promise.all(collections.map((collection) => db.dropCollection(collection.name)))
    },
  }
}

export { workflowRepositoryManager }
