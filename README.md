# flumelog-array

> like flumelog-memory without the filesystem

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Install

```
npm install flumelog-array
```

## Usage

```js
const Log = require('flumelog-array')
const Flume = require('flumedb')

var db = Flume(Log())

db.append({foo: 1}, function (err, seq) {
  if (err) throw err
  db.get(seq, (err, val) => {
    if (err) throw err
    console.log(val) // => { foo: 1 }
  })
})
```

## Maintainers

[@fraction](https://github.com/fraction)

## Contributing

PRs accepted.

## License

ISC © 2018 Fraction LLC
