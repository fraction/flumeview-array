const Log = require('flumelog-array')
const Flume = require('flumedb')
const test = require('tape')
const View = require('../')

const log = Log()
const db = Flume(log)

db.use('bool', View(x => !!x))

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
