mongodb-fixture
===============

#### MongoDB fixture utility for unit testing ####

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![coveralls][coveralls-image]][coveralls-url]

The only __real__ way to ensure that a query returns what it should is by executing it in a __real__ database. Database calls can be stubbed when you don't want to execute driver calls, but if you need to test the query itself, then you're forced to talk with the database.

Sure, it'll be better to have some kind of module with the implementation of the full query interface and operators, but who does it better than the MongoDB driver? The ideal case would be to have in-memory mode for MongoDB to avoid disk usage.

This library just wraps some MongoDB driver calls for your convenience and exposes the Db object. You can store data easily and reset the state with each test. Set up and tear down the connection only once per test execution.

By default, the `testing` database will be used for testing. So, be sure that the database doesn't contain data since it will be dropped when the connection is established to ensure a clean initial state.

If your server is well-structured, you should have the MongoDB Db connection object injected in your code somehow, so you could easily replace the real database connection with a fake connection used for testing purposes. For example, if you're using the Hapi framework, I recommend to store the Db object in the [server.app][server-app] namespace and use that object from inside any Hapi method. This way you can easily methods and route handlers without hardcoding dependencies by using `require()`.

```javascript
// mongodb://localhost:27017/testing
var mongodb = require('mongodb-fixture')();

before(function (done) {
  // Connect to he database and ensure a clean initial state
  mongodb.setUp(function (err) {
    if (err) return done(err);

    // Pass the 'mongodb.db' object to your system
    
    done();
  });
});

after(function (done) {
  // Clean the state and disconnect
  mongodb.tearDown(done);
});

describe('foo', function () {
  before(function (done) {
    // Populate the database with collections and documents
    mongodb.fixture({
      collection1: [
        { doc: 1 },
        { doc: 2 }
      ],
      collection2: [
        { row: 1 },
        { row: 2 }
      ]
    }, done);
  });

  after(function (done) {
    // Clean the database to its initial state
    mongodb.reset(done);
  });

  it('bar', function (done) {
    // Get all the documents from the collection
    mongodb.get('collection1', function (err, docs) {
      if (err) return done(err);

      expect(docs).to.have.length(2).and.to.deep.equal([
        { doc: 1 },
        { doc: 2 }
      ]);

      done();
    });
  });

  it('baz', function (done) {
    // Get the last inserted document from the collection
    mongodb.last('collection2', function (err, doc) {
      if (err) return done(err);

      expect(doc).to.exist().and.to.deep.equal({ row: 2 });

      done();
    });
  });
});
```

___module_([options]) : TestConnection__

Options:

- __host__ - _String_  
  Hostname of the database. Default is `localhost`.
- __port__ - _Number_  
  Port of the database. Default is `27017`.
- __database__ - _String_  
  Name of the database. Default is `testing`.
- __db__ - _Object_  
  MongoDB Db object. If the Db object is passed, the other options are ignored.

[npm-image]: https://img.shields.io/npm/v/mongodb-fixture.svg?style=flat
[npm-url]: https://npmjs.org/package/mongodb-fixture
[travis-image]: https://img.shields.io/travis/gagle/node-mongodb-fixture.svg?style=flat
[travis-url]: https://travis-ci.org/gagle/node-mongodb-fixture
[coveralls-image]: https://img.shields.io/coveralls/gagle/node-mongodb-fixture.svg?style=flat
[coveralls-url]: https://coveralls.io/r/gagle/node-mongodb-fixture
[server-app]: http://hapijs.com/api#serverapp