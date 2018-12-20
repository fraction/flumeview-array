// It's important for `flumelog.stream(opts)` to handle all sorts of different
// options, which have been abstracted into the pull-cursor module.
const pullCursor = require('pull-cursor')

// The obv module creates an observable, which is like a cross between
const Obv = require('obv')

// There are two helper functions that depend on `db` and `since`.
// Instead of hardcoding them below, we create a sort of factory.
const createHelpers = (log, since) => {
  // This is specific to pull-cursor, but the gist is that we need to describe
  // a way for pull-cursor to read elements out of our log. This is copy and
  // pasted from the readme, so we aren't doing anything novel here.
  const getMeta = (offset, useCache, cb) => {
    if (offset < 0 || offset >= log.length) {
      // TODO: Add tests for this error in test-flumelog.
      cb(new Error('out of bounds:' + offset))
    } else {
      cb(null, log[offset], offset - 1, offset + 1)
    }
  }

  return {
    // A basic pull-cursor invokation, copied from the readme.
    // Pay no attention to the code behind the curtain!
    createStream: pullCursor(since, getMeta),

    // It would be trivial to do this manually, but this keeps our code DRY.
    updateSince: () => since.set(log.length - 1)
  }
}

module.exports = () => () => {
  // Just a simple array used to store each item in the log.
  const log = []

  // Observable to track number of items in log.
  const since = Obv()

  // Create helpers that depend on `log` and `since`.
  const { createStream, updateSince } = createHelpers(log, since)

  // Set `since.value` to `-1`, which means we have 0 items.
  // This should always be `db.length - 1` except when appending many items.
  updateSince()

  return {
    // Take a sequence number as input, read it from the array, and callback.
    get: (seq, cb) => cb(null, log[seq]),
    stream: (opts) => createStream(opts),
    since: since,
    append: (items, cb) => {
      // We can accept either a single item or multiple, which run in a batch.
      if (Array.isArray(items) === false) {
        // To minimize complexity, we turn single items into an array.
        items = [ items ]
      }

      items.forEach((item) => log.push(item))

      // When we append multiple items to the log this is only called once.
      // This allows us to append in batches for better performance.
      updateSince()

      // Return the sequence number so that the caller knows the latest offset.
      cb(null, since.value)
    },
    // We aren't persisting this log in a directory. :)
    dir: null
  }
}
