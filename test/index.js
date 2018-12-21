const test = require('tape')
const Flume = require('flumedb')
const Log = require('flumelog-array')
const Obv = require('obv')

const View = require('../')

// Track deletes with a simple observable.
// Very experimental, use at your own risk.
const deleteObv = Obv()
const log = Log()

const db = Flume(log).use('bool', View(x => !!x, deleteObv))

// patch flumedb to allow deletion
if (typeof db.del !== 'function') {
  db.del = (seq, cb) => {
    if (db.closed) {
      throw new Error('cannot call: del, flumedb instance closed')
    }

    log.since.once(() => log.del(seq, cb))
    // TODO: iterate through flumeviews and delete
    // Below we have a janky view-specific deletion observable.
    // This should be universal.
    deleteObv.set(seq)
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
          t.equal(item, undefined, 'deleted from view')
          t.end()
        })
      })
    })
  })
})
