const pull = require('pull-stream')
const Log = require('flumelog-array')
const Obv = require('obv')

module.exports = (map, deleteObv) => () => {

  // HACK: FLUMEVIEW-DELETE
  if (deleteObv != null) {
    // This observable is used whenever we need something deleted.
    // It's a hack, but it's the only option without `flumedb.views` access.
    console.warn('WARNING: Using experimental delete observable')
  }


  // This array tracks deletes.
  // Each item in this array is a deleted `seq`.
  // HACK: FLUMEVIEW-DELETE
  const deleted = []

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
    del: (seq, cb) => {
      // HACK: FLUMEVIEW-DELETE
      deleted.push(seq)

      // Delete the item from the flumeview.
      flumelogArray.del(seq, (err, seq) => {
        if (err) return cb(err)
        cb(null, seq)
      })
    },
    destroy: (cb) => {
      // Re-initialize `flumelogArray` and reset `since`.
      flumelogArray = Log()
      since.set(-1)
      cb(null)
    },
    get: (seq, cb) => {
      // HACK: FLUMEVIEW-DELETE
      if (deleteObv && deleted.includes(seq) === false) {
        return cb(null, undefined)
      }

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



  // HACK: FLUMEVIEW-DELETE
  deleteObv((seq) => {
    api.del(seq, (err) => {
      if (err) throw err
    })
  })

  return api
}
