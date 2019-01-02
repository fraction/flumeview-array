const test = require('tape')
const Flume = require('flumedb')
const Log = require('flumelog-array')
const Obv = require('obv')

const View = require('../')

const log = Log()

const db = Flume(log)
  .use('bool', View(
    x => !!x
  ))

// patch flumedb to allow deletion
// HACK: FLUMEVIEW-DELETE
if (typeof db.del !== 'function') {
  db.del = (seq, cb) => {
    if (db.closed) {
      throw new Error('cannot call: del, flumedb instance closed')
    }

    log.since.once(() => log.del(seq, (err) => {
      if (err) return cb(err)

      // Avoid calling `cb` multiple times
      let errored = false

      Object.entries(db.views).forEach(entry => {
        if (errored === false) {
          const [ name, view ] = entry

          if (typeof view.del === 'function') {
            view.del(seq, (err) => {
              if (err) {
                errored = true
                cb(err)
              }
            })
          } else {
            // TODO: Rebuild each individual view that doesn't support deletion.
            console.log(`WARNING: item ${seq} not deleted from ${name} flumeview`)
          }
        }
      })

      // TODO: Wait until all deletions are complete.
      if (errored === false) {
        cb(null, seq)
      }
    }))

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
