'use strict';

module.exports = function (options) {
  return new TestConnection(options);
};

var TestConnection = function (db) {
  this._db = db;
  this._collections = {};
};

TestConnection.prototype._connect = function (cb) {
  if (this._db.serverConfig.connected) return cb();
  this._db.open(cb);
};

TestConnection.prototype._collection = function (collection) {
  var col = this._collections[collection];
  if (col) return col;
  col = this._collections[collection] = this._db.collection(collection);
  return col;
};

TestConnection.prototype.setUp = function (cb) {
  var me = this;
  this._connect(function (err) {
    if (err) return cb(err);
    me.reset(cb);
  });
};

TestConnection.prototype.tearDown = function (cb) {
  var me = this;
  this._db.dropDatabase(function (err) {
    if (err) return cb(err);
    me._db.close(function (err) {
      if (err) return cb(err);
      me._db = null;
      cb();
    });
  });
};

var insert = function (test, collections, collectionNames, index, cb) {
  if (index === collectionNames.length) return cb();
  var collection = collectionNames[index];
  test._collection(collection).insertMany(collections[collection],
      function (err) {
    if (err) return cb(err);
    insert(test, collections, collectionNames, index + 1, cb);
  });
};

TestConnection.prototype.fixture = function (fixture, cb) {
  insert(this, fixture, Object.keys(fixture), 0, cb);
};

TestConnection.prototype.get = function (collection, query, projection, cb) {
  var len = arguments.length;
  if (len === 2) {
    cb = query;
    query = null;
    projection = {};
  } else if (len === 3) {
    cb = projection;
    projection = {};
  }
  this._collection(collection).find(query, projection).toArray(cb);
};

TestConnection.prototype.last = function (collection, projection, cb) {
  if (arguments.length === 2) {
    cb = projection;
    projection = {};
  }
  this._collection(collection).find(null, projection).sort({ $natural: -1 })
      .limit(1).nextObject(cb);
};

TestConnection.prototype.drop = function (collections, cb) {
  var arr = typeof collections === 'object'
      ? Object.keys(collections)
      : [].concat(collections);
  var arrLength = arr.length;
  var me = this;

  (function drop(index) {
    if (index === arrLength) return cb();
    var collection = arr[index];
    me._collection(collection).drop(function (err) {
      if (err) return cb(err);
      me._collections[collection] = null;
      drop(index + 1);
    });
  })(0);
};

TestConnection.prototype.reset = function (cb) {
  this._db.dropDatabase(function (err) {
    // Don't expose the 'results' argument
    cb(err);
  });
};