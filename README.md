# flumeview-array

> simple flumeview built on flumelog-array

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Install

```
npm install flumeview-array
```

## Usage

```js
const Log = require('flumelog-array')
const Flume = require('flumedb')
const View = require('flumeview-array')

var db = Flume(Log())

db.use('bool', View(x => !!x))

db.append({foo: 1}, function (err, seq) {
  if (err) throw err
  db.bool.get(seq, (err, val) => {
    if (err) throw err
    console.log(val) // => true
  })
})
```

## Maintainers

[@fraction](https://github.com/fraction)

## Contributing

PRs accepted.

## License

ISC © 2018 Fraction LLC
