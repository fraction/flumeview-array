const Log = require('../')
const Flume = require('flumedb')
const test = require('tape')

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

test('delete', function (t) {
  t.plan(3)

  db.append([ 'a', 'b', 'c' ], (err, seq) => {
    t.error(err)
    db.del(seq, (err, seq) => {
      t.error(err)
      db.get(seq, (err, item) => {
        t.error(err)
        t.end(item)
      })
    })
  })
})
