# External / shared `pg.Pool` support (Immuta)

This Immuta fork build (`0.12.2-immuta5`) accepts an externally managed [`pg.Pool`](https://node-postgres.com/apis/pool) on the Waterline connection config:

```js
connections: {
  immutaDb: {
    adapter: 'immutaDb',
    host: '...',
    // ...
    pool: sharedPgPool, // or pgPool
  },
}
```

Behavior:

- If `pool` / `pgPool` is set during `registerConnection`, the adapter uses that pool for all queries.
- `teardown` does **not** call `pool.end()` for an external pool (the owner must end it).
- If no external pool is provided, the adapter creates and owns a pool as before.

Consumers (e.g. bodata) should depend on this package via a git tag after merge, e.g. `github:immuta/sails-postgresql#v0.12.2-immuta5`.
