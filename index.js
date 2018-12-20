const Obv = require('obv')

const flumelog = {}

flumelog.get = (seq, cb) => {
  cb(null, seq)
}

flumelog.stream = (opts) => {
  return opts
}

flumelog.since = () => {
  return Obv()
}

flumelog.append = (value, cb) => {
  const seq = 42
  cb(null, seq)
}

flumelog.dir = null

module.exports = flumelog
