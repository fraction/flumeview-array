const test = require('tape')
const Flume = require('flumedb')
const Log = require('flumelog-array')
const View = require('../')

const db = Flume(Log()).use('bool', View(x => !!x))

test('append + delete + get + view.get', function (t) {
  // Append three values.
  db.append([ 1, 0, 1 ], (err, seq) => {
    t.error(err, 'append success')
    t.equal(seq, 2, 'items added')
    // Delete one.
    db.rebuild((err) => {
      t.error(err, 'rebuild success')
      db.get(seq, (err, item) => {
        t.error(err, 'get success')
        t.equal(item, undefined, 'still deleted from log')
        // Ensure the value was deleted from the view.
        db.bool.get(seq, (err, item) => {
          t.error(err, 'view.get success')
          t.equal(item, undefined, 'still deleted from view')
          t.end()
        })
      })
    })
  })
})
