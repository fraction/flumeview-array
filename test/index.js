const test = require('tape')
const Flume = require('flumedb')
const Log = require('flumelog-array')
const View = require('../')

const db = Flume(Log()).use('bool', View(x => !!x))

test('append + delete + get + view.get', { timeout: 5000 }, function (t) {
  // Append three values.
  db.append([ 1, 0, 1 ], (err, seq) => {
    t.error(err, 'append success')
    t.equal(seq, 2, 'items added')
    // Delete one.
    db.del([seq, seq - 1], (err) => {
      t.error(err, 'delete success')
      // Ensure the value was deleted from the log.
      db.get(seq, (err, item) => {
        t.error(err, 'get success')
        t.equal(item, undefined, 'deleted from log')
        // Ensure the value was deleted from the view.
        db.get(seq - 1, (err, item) => {
          t.error(err, 'get success')
          t.equal(item, undefined, 'also deleted from log')
          // Ensure the value was deleted from the view.
          db.bool.get(seq, (err, item) => {
            t.error(err, 'view.get success')
            t.equal(item, undefined, 'deleted from view')
            db.bool.get(seq - 1, (err, item) => {
              t.error(err, 'view.get success')
              t.equal(item, undefined, 'also deleted from view')
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
        })
      })
    })
  })
})
