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

- If `pool` is set during `registerConnection`, the adapter uses that pool for all queries (sticky external mode).
- The pool is not stored on the connection config object (avoids leaking credentials in error logs).
- `teardown` does **not** call `pool.end()` for an external pool and does not clear the module pool reference (the owner manages lifecycle).
- Registering again **without** `pool` leaves external mode so the adapter can create and own a pool as before (e.g. test mocks).
- Registering again **with** `pool` re-enters external mode (replacing the sticky reference if needed).

Consumers (e.g. bodata) should depend on this package via a git tag after merge, e.g. `github:immuta/sails-postgresql#v0.12.2-immuta5`.
