const pullCursorArray = require('pull-cursor-array')
const Obv = require('obv')

module.exports = () => {
  // Create a simple array to hold items in the log.
  // This array is ephemeral, it isn't persisted anywhere.
  const log = []

  // Track the state of the log by using an observable.
  // The value of the observable is the *offset* of the last item added.
  // If the log had an item this would be `0` (because `log[0]`).
  // Since the log is empty, it can be initialized to `-1`.
  const since = Obv().set(-1)

  // The pull-cursor module exports a function that accepts stream options.
  // For example: `createStream({ live: true, gt: 42 })`.
  // The pull-cursor-array module is a tiny abstraction specific to arrays.
  const createStream = pullCursorArray(log, since)

  return {
    append: (items, cb) => {
      if (Array.isArray(items) === false) {
        // The `items` argument may be a single value or an array.
        // To minimize complexity, this ensures `items` is always an array.
        items = [ items ]
      }

      // Since `items` is an array, `Array.forEach` can be used to append.
      items.forEach((item) => log.push(item))

      // It's important that `since` is only updated once per `append()`.
      // This allows us to make changes in batches for better performance.
      since.set(log.length - 1)

      // Return the new value of `since` when the append operation completes.
      cb(null, since.value)
    },
    del: (seq, cb) => {
      // This is experimental and unsupported by flumedb.
      // If you're learning flumedb, you should ignore this. :)
      delete log[seq]
      cb(null, since.value)
    },
    dir: null,
    get: (seq, cb) => {
      // Take a sequence number as input, read it from the array, and callback.
      // Note that this returns `undefined` when `seq` isn't a valid index.
      cb(null, log[seq])
    },
    since: since,
    stream: (opts) => createStream(opts)
  }
}
