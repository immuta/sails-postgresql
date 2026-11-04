# External / shared `pg.Pool` support (Immuta)

This Immuta fork build (`0.12.2-immuta6`) accepts an externally managed [`pg.Pool`](https://node-postgres.com/apis/pool) on the Waterline connection config:

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

Consumers (e.g. bodata) should depend on this package via a git tag after merge, e.g. `github:immuta/sails-postgresql#v0.12.2-immuta6`.

## Connect / acquire errors (ENG-259)

When the shared (or owned) pool fails to hand out a client — for example
`timeout exceeded when trying to connect` after `connectionTimeoutMillis`, or
Postgres `53300` (too many connections) — `pg-pool` may invoke the connect
callback with only `err` (no release/`done` function).

`0.12.2-immuta6` guards client release so that path always returns via the
Waterline `cb(err)` instead of throwing `TypeError: done is not a function`
(which previously killed the Node worker and showed up as Datadog `WorkerDeath`).
