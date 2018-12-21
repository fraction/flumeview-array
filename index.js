const Log = require('flumelog-array')
const pull = require('pull-stream')
const Obv = require('obv')

module.exports = (map, deleteObv) => () => {
  if (deleteObv != null) {
    console.log('WARNING: Using experimental delete observable')
  }
  let flumelogArray = Log()
  const since = Obv()
  since.set(-1)

  const deleted = []

  const api = {
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
      get: 'async',
      del: 'async'
    },
    since,
    close: (cb) => cb(null),
    ready: (cb) => cb(null),
    get: (seq, cb) => {
      if (deleteObv && deleted.includes(seq) === false) {
        return cb(null, undefined)
      }

      flumelogArray.get(seq, (err, item) => {
        if (err) return cb(err)
        cb(null, item)
      })
    },
    del: (seq, cb) => {
      deleted.push(seq)
      flumelogArray.del(seq, (err, seq) => {
        if (err) return cb(err)
        cb(null, seq)
      })
    }
  }

  deleteObv((seq) => {
    api.del(seq, (err) => {
      if (err) throw err
    })
  })

  return api
}
