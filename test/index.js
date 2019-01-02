const test = require('tape')
const Flume = require('flumedb')
const Log = require('flumelog-array')

const View = require('../')

const log = Log()
const db = Flume(log).use('bool', View(x => !!x))

test('append + delete + get + view.get', function (t) {
  // Append three values.
  db.append([ 1, 0, 1 ], (err, seq) => {
    t.error(err, 'append success')
    t.equal(seq, 2, 'items added')
    // Delete one.
    db.del(seq, (err, seq) => {
      t.error(err, 'delete success')
      // Ensure the value was deleted from the log.
      db.get(seq, (err, item) => {
        t.error(err, 'get success')
        t.equal(item, undefined, 'deleted from log')
        // Ensure the value was deleted from the view.
        db.bool.get(seq, (err, item) => {
          t.error(err, 'view.get success')
          t.equal(item, undefined, 'deleted from view')
          t.end()
        })
      })
    })
  })
})
