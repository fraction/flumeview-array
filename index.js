const Log = require('flumelog-array')
const pull = require('pull-stream')
const Obv = require('obv')

module.exports = (map) => () => {
  let flumelogArray = Log()
  const since = Obv()
  since.set(-1)

  return {
    createSink: (cb) => {
      return pull.drain((item) => {
        flumelogArray.append(map(item), (err, seq) => {
          if (err) return cb(err)
          since.set(seq)
        })
      }, cb)
    },
    destroy: (cb) => {
      since.set(-1)
      flumelogArray = Log()
      return cb(null)
    },
    methods: {
      get: 'async'
    },
    since,
    close: (cb) => cb(null),
    ready: (cb) => cb(null),
    get: (seq, cb) => {
      flumelogArray.get(seq, (err, item) => {
        if (err) return cb(err)
        cb(null, item)
      })
    },
    del: (seq, cb) => {
      flumelogArray.del(seq, (err, seq) => {
        if (err) return cb(err)
        cb(null, seq)
      })
    }
  }
}
