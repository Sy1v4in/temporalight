import util from 'util'

const toString = (value: unknown) => util.inspect(value, { depth: Infinity, showHidden: false })

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export { toString, wait }
