const pull = require('pull-stream')
const Log = require('flumelog-array')
const Obv = require('obv')
const debug = require('debug')('flumeview-array')

module.exports = (map) => () => {
  // This view is backed up by a simple in-memory flumelog.
  let log = Log()

  // Here we record the sequence number of the latest item in the view.
  // When the view is empty, the sequence number is set to `-1`.
  // Our first item will have a sequence number of `0`.
  const since = Obv().set(-1)

  // When this view is destroyed (e.g. `flumedb.rebuild()`) we need a way to
  // abort the pull-stream sink created with `flumeview.createSink()`.
  // XXX: Can multiple sinks be open at the same time?
  let abortSink

  const api = {
    close: (cb) => cb(null),
    createSink: (cb) => {
      debug('createSink')

      abortSink = cb

      return pull.drain((item) => {
        let value

        // If value was deleted upstream, add a blank message.
        if (item.value === undefined) {
          value = undefined
        } else {
          value = map(item.value)
        }

        log.append(value, (err) => {
          if (err) return cb(err)
          since.set(item.seq)
        })
      }, cb)
    },
    del: (seqs, cb) => log.del(seqs, cb),
    destroy: (cb) => {
      debug('destroy')

      // Re-initialize `flumelogArray` and reset `since`.
      log = Log()
      since.set(-1)

      abortSink(null)
      cb(null)
    },
    get: (seq, cb) => {
      log.get(seq, (err, item) => {
        if (err) return cb(err)
        cb(null, item)
      })
    },
    methods: {
      get: 'async',
      del: 'async'
    },
    ready: (cb) => cb(null),
    since
  }

  return api
}
