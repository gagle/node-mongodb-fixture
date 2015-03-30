mongodb-fixture
===============

#### MongoDB fixture utility for testing ####

[![npm][npm-image]][npm-url]

The only __real__ way to ensure that a query returns what it should is by executing it in a __real__ database. Database calls can be stubbed when you don't want to execute driver calls, but if you need to test the query itself, then you're forced to talk with the database.

Sure, it'll be better to have some kind of module with the implementation of the full query interface and operators, but we already have one, the MongoDB drivers, so let's use them. It'd be good to have an in-memory mode for MongoDB to avoid disk usage, but for now a MongoDB process running is all what we need.

This library just wraps some driver calls for your convenience and exposes the Db object. You can store data easily and reset the state for each test. Set up and tear down the connection only once per test execution.

Be sure that the database doesn't contain data since it will be dropped when the connection is established to ensure a clean initial state.

If your server is well-structured, you should have the MongoDB Db connection injected into your business logic as a dependency, so you could easily replace the real database connection with a fake connection for testing purposes. For example, if you're using the Hapi framework, I recommend to store the Db object in the [server.app][server-app] namespace and make it available from inside any Hapi method by binding `this`: `server.bind(server.app)`. This way you can easily test methods and route handlers without hardcoding dependencies with `require()` calls.

```javascript
var MongoClient = require('mongodb').MongoClient;
var mongodbFixture = require('mongodb-fixture');

var database;

before(function (done) {
  MongoClient.connect('mongodb://localhost:27017/testing', function (err, db) {
    if (err) return done(err);

    // Inject the 'db' object to your system

    database = mongodbFixture(db);

    // Connect and ensure a clean initial state
    database.setUp(done);
  });
});

after(function (done) {
  // Clean the state and disconnect
  database.tearDown(done);
});

describe('foo', function () {
  var collections = {
    collection1: [
      { doc: 1 },
      { doc: 2 }
    ],
    collection2: [
      { row: 1 },
      { row: 2 }
    ]
  };

  before(function (done) {
    // Populate the database with collections and documents
    database.fixture(collections, done);
  });

  after(function (done) {
    // Clean the database to its initial state
    database.reset(done);

    // Or drop the collections by hand
    // 3 alternatives
    database.drop('collection1', function (err) {
      if (err) return done(err);

      database.drop('collection2', done);
    });

    // better...
    database.drop(['collection1', 'collection2'], done);

    // best
    database.drop(collections, done);
  });

  it('bar', function (done) {
    // Get all the documents from the collection
    database.get('collection1', function (err, docs) {
      if (err) return done(err);

      expect(docs).to.deep.equal([
        { doc: 1 },
        { doc: 2 }
      ]);

      done();
    });
  });

  it('baz', function (done) {
    // Get the last inserted document from the collection
    database.last('collection2', function (err, doc) {
      if (err) return done(err);

      expect(doc).to.deep.equal({ row: 2 });

      done();
    });
  });
});
```

___module_(db) : TestConnection__

Returns a new TestConnection instance. The MongoDB Db object is mandatory. The connection is opened automatically if it's not.

__TestConnection#drop(collections, callback) : undefined__

Drops the specified collections. `collections` can be a String with the collection name, an array of collection names or an object whose keys are collection names, that is, the `fixture` parameter from the `fixture()` function can be reused. The callback receives an error as the first argument.

__TestConnection#fixture(fixture, callback) : undefined__

Inserts documents into collections, that is, sets the state of the database with data. The callback receives an error as the first argument.

`fixture` is an object whose keys are the collection name and their value an array of documents:

```javascript
fixture({
  collection1: [
    { doc: 1 },
    { doc: 2 }
  ],
  collection2: [
    { row: 1 },
    { row: 2 }
  ]
}, cb);
```

__TestConnection#get(collection[, query[, projection]], callback) : undefined__

Returns  all the rows from the given collection. The callback receives an error as the first argument and an array as the second.

```javascript
get('collection', cb)
get('collection', { foo: 'bar' }, cb)
get('collection', { foo: 'bar' }, { foo: true }, cb)
get('collection', null, { foo: true }, cb)
```

__TestConnection#last(collection[, projection], callback) : undefined__

Returns the last inserted document or null if the collection is empty. The callback receives an error as the first argument and the document as the second.

__TestConnection#reset(callback) : undefined__

Drops the selected database. Use it to ensure a clean state. The callback receives an error as the first argument.

__TestConnection#setUp(callback) : undefined__

Opens a connection and drops the selected database to ensure a clean initial state. Set up only once per test. The callback receives an error as the first argument.

__TestConnection#tearDown(callback) : undefined__

Drops the selected database and disconnects. Tear down onlt once per test. The callback receives an error as the first argument.

[npm-image]: https://img.shields.io/npm/v/mongodb-fixture.svg?style=flat
[npm-url]: https://npmjs.org/package/mongodb-fixture