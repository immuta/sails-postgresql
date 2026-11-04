/**
 * ENG-259: pool.connect may call back with only `err` (no `done`) on acquire/connect
 * timeout. Calling done() unconditionally threw and killed the worker.
 *
 * These tests use an external mock pool so no real Postgres is required.
 */

var should = require('should');
var adapter = require('../../lib/adapter');
var Support = require('./support/bootstrap');

describe('safeRelease on connect error', function() {

  var connectionId = 'safe_release_test';
  var originalConsoleError;

  beforeEach(function() {
    // Adapter logs troubleshooting tips on connect failure; keep mocha output clean.
    originalConsoleError = console.error;
    console.error = function() {};
  });

  afterEach(function(done) {
    console.error = originalConsoleError;
    adapter.teardown(connectionId, function() {
      // Leave sticky external mode so subsequent unit tests can own a pool again.
      adapter.registerConnection({
        identity: connectionId + '_reset_external',
        host: 'localhost',
        user: 'sails',
        password: 'sails',
        database: 'sailspg'
      }, {}, function() {
        adapter.teardown(connectionId + '_reset_external', done);
      });
    });
  });

  function collectionFixture() {
    var collection = Support.Collection('safe_release_table');
    collection.connection = connectionId;
    collection.waterline.schema.safe_release_table.connection = connectionId;
    return collection;
  }

  function registerWithPool(mockPool, cb) {
    adapter.registerConnection({
      identity: connectionId,
      pool: mockPool,
      host: 'localhost',
      user: 'sails',
      password: 'sails',
      database: 'sailspg'
    }, { safe_release_table: collectionFixture() }, cb);
  }

  it('should callback with connect err and not throw when done is omitted', function(done) {
    var connectErr = new Error('timeout exceeded when trying to connect');
    var uncaught;

    function onUncaught(err) {
      uncaught = err;
    }
    process.once('uncaughtException', onUncaught);

    registerWithPool({
      connect: function(cb) {
        // pg-pool acquire/connect timeout shape: err only, no client/done
        cb(connectErr);
      }
    }, function(err) {
      process.removeListener('uncaughtException', onUncaught);

      try {
        should.exist(err);
        err.should.equal(connectErr);
        should.not.exist(uncaught);
        done();
      } catch (assertErr) {
        done(assertErr);
      }
    });
  });

  it('should still call done when connect fails with a release function', function(done) {
    var connectErr = new Error('timeout exceeded when trying to connect');
    var releaseCalls = 0;

    registerWithPool({
      connect: function(cb) {
        cb(connectErr, null, function release() {
          releaseCalls += 1;
        });
      }
    }, function(err) {
      try {
        should.exist(err);
        err.should.equal(connectErr);
        releaseCalls.should.equal(1);
        done();
      } catch (assertErr) {
        done(assertErr);
      }
    });
  });

  it('should not throw if done() throws during connect-error release', function(done) {
    var connectErr = new Error('timeout exceeded when trying to connect');
    var uncaught;

    function onUncaught(err) {
      uncaught = err;
    }
    process.once('uncaughtException', onUncaught);

    registerWithPool({
      connect: function(cb) {
        cb(connectErr, null, function release() {
          throw new Error('release failed');
        });
      }
    }, function(err) {
      process.removeListener('uncaughtException', onUncaught);

      try {
        should.exist(err);
        err.should.equal(connectErr);
        should.not.exist(uncaught);
        done();
      } catch (assertErr) {
        done(assertErr);
      }
    });
  });
});
