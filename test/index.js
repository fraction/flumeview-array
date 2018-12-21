const Log = require('../')
const Flume = require('flumedb')
const test = require('tape')
const Obv = require('obv')
const pull = require('pull-stream')

const log = Log()
const db = Flume(log)

// patch flumedb to allow deletion
if (typeof db.del !== 'function') {
  db.del = (seq, cb) => {
    if (db.closed) {
      throw new Error('cannot call: del, flumedb instance closed')
    }

    log.since.once(() => log.del(seq, cb))
    // TODO: iterate through flumeviews and delete
  }
}

// flumeview-flumelog-offset :)
db.use('bool', () => {
  let flumelogArray = Flume(Log())
  const since = Obv()
  since.set(-1)

  return {
    createSink: (cb) => {
      return pull.drain((item) => {
        const truthy = !!item.value
        flumelogArray.append(truthy, (err, seq) => {
          if (err) return cb(err)
          since.set(seq)
        })
      }, cb)
    },
    destroy: (cb) => {
      since.set(-1)
      flumelogArray = Flume(Log())
      return cb(null)
    },
    methods: {
      get: 'async'
    },
    since,
    close: (cb) => cb(null),
    ready: (cb) => cb(null),
    // our actual method!
    get: (seq, cb) => {
      flumelogArray.get(seq, (err, item) => {
        if (err) return cb(err)
        cb(null, item)
      })
    },
    del: (seq, cb) => {
      console.log('delete me')
      flumelogArray.del(seq, (err, seq) => {
        if (err) return cb(err)
        cb(null, seq)
      })
    }
  }
})

test('append + delete + get + view.get', function (t) {
  // append three values
  db.append([ 1, 0, 1 ], (err, seq) => {
    t.error(err, 'append success')
    t.equal(seq, 2, 'items added')
    db.del(seq, (err, seq) => {
      t.error(err, 'delete success')
      db.get(seq, (err, item) => {
        t.error(err, 'get success')
        t.equal(item, undefined, 'deleted from log')

        db.bool.get(seq, (err, item) => {
          t.error(err, 'view.get success')
          // TODO: t.equal(item, undefined, 'deleted from view')
          t.end()
        })
      })
    })
  })
})
