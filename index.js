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
  let abortSink

  const api = {
    close: (cb) => cb(null),
    createSink: (cb) => {
      debug('createSink')

      abortSink = cb

      return pull.drain((item) => {
        if (item.seq > since) {
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
        } else {
          // rebuild!
        }
      }, cb)
    },
    del: log.del,
    rebuild: (items, cb) => {
      console.log('hmm')
      items.forEach(item => {
        console.log('rebuilding item:', item)
        log.put(item.seq, map(item.value))
        log.get(item.seq, cb)
      })
    },
    destroy: (cb) => {
      debug('destroy')

      // Re-initialize `flumelogArray` and reset `since`.
      log = Log()
      since.set(-1)

      abortSink(null)
      cb(null)
    },
    get: log.get,
    methods: {
      get: 'async',
      del: 'async'
    },
    ready: (cb) => cb(null),
    since
  }

  return api
}
