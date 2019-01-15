const pull = require('pull-stream')
const Log = require('flumelog-memory')
const Obv = require('obv')

module.exports = (map) => () => {
  // This view is backed up by a simple in-memory flumelog.
  let flumelogArray = Log()
  let abort

  const since = Obv().set(-1)

  const api = {
    close: (cb) => cb(null),
    createSink: (cb) => {
      abort = cb
      return pull.drain((item) => {
        const value = map(item.value)

        flumelogArray.append(value, (err, seq) => {
          if (err) return cb(err)
          since.set(seq)
        })
      }, cb)
    },
    destroy: (cb) => {
      // Re-initialize `flumelogArray` and reset `since`.
      flumelogArray = Log()
      since.set(-1)

      abort(null)
      cb(null)
    },
    get: (seq, cb) => {
      flumelogArray.get(seq, (err, item) => {
        if (err) return cb(err)
        cb(null, item)
      })
    },
    methods: {
      get: 'async',
      destroy: 'async' // XXX: shouldn't this be exported by default?
    },
    ready: (cb) => cb(null),
    since
  }

  return api
}
