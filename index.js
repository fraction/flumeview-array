const pull = require('pull-stream')
const Log = require('flumelog-array')
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
        let value

        // If value was deleted upstream, add a blank message.
        if (item.value === undefined) {
          value = undefined
        } else {
          value = map(item.value)
        }

        flumelogArray.append(value, (err, seq) => {
          if (err) return cb(err)
          since.set(seq)
        })
      }, cb)
    },
    del: (seqs, cb) => flumelogArray.del(seqs, cb),
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
      del: 'async',
      destroy: 'async' // XXX: shouldn't this be exported by default?
    },
    ready: (cb) => cb(null),
    since
  }

  return api
}
