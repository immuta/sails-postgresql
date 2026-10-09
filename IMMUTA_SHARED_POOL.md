# External / shared `pg.Pool` support (Immuta)

This Immuta fork build (`0.12.2-immuta5`) accepts an externally managed [`pg.Pool`](https://node-postgres.com/apis/pool) on the Waterline connection config:

```js
connections: {
  immutaDb: {
    adapter: 'immutaDb',
    host: '...',
    // ...
    pool: sharedPgPool,
  },
}
```

Behavior:

- If `pool` is set during `registerConnection`, the adapter uses that pool for all queries.
- The pool is not stored on the connection config object (avoids leaking credentials in error logs).
- `teardown` does **not** call `pool.end()` for an external pool (the owner must end it). The adapter only drops its reference once no registered connections still use that pool (or on full teardown).
- If no external pool is provided, the adapter creates and owns a pool as before.

Consumers (e.g. bodata) should depend on this package via a git tag after merge, e.g. `github:immuta/sails-postgresql#v0.12.2-immuta5`.
