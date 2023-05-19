import util from 'util'

const toString = (value: unknown) => util.inspect(value, { depth: Infinity, showHidden: false })

export { toString }
