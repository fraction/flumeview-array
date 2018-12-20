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
  }
}


// flumeview-flumelog-offset ;)
db.use('bool', () => {
  let flumelogArray = Flume(Log())
  const since = Obv()
  since.set(-1)

  return {
    createSink: (cb) => {
      return pull.drain((item) => {
        const truthy = !!item.value;
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
    }
  }
})

// pretty broken rn, please ignore
test('delete', function (t) {
  db.append([ 1, 0, 1 ], (err, seq) => {
    t.error(err)
    db.del(seq, (err, seq) => {
      t.error(err)
      db.get(seq, (err, item) => {
        t.error(err)
        t.ok(typeof item === undefined)

        db.bool.get(2, (err, item) => {
          t.error(err)
          t.ok(typeof item === undefined)
          t.end()
        })
      })
    })
  })
})
