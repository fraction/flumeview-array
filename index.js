const pull = require('pull-stream')
const Log = require('flumelog-array')
const Obv = require('obv')

module.exports = (map) => () => {
  // This view is backed up by a simple in-memory flumelog.
  let flumelogArray = Log()
  const since = Obv().set(-1)

  const api = {
    close: (cb) => cb(null),
    createSink: (cb) => {
      return pull.drain((item) => {
        flumelogArray.append(map(item), (err, seq) => {
          if (err) return cb(err)
          since.set(seq)
        })
      }, cb)
    },
    del: (seq, cb) => flumelogArray.del(seq, cb),
    destroy: (cb) => {
      // Re-initialize `flumelogArray` and reset `since`.
      flumelogArray = Log()
      since.set(-1)
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
      del: 'async'
    },
    ready: (cb) => cb(null),
    since
  }

  return api
}
