'use strict';

var MongoClient = require('mongodb').MongoClient;

module.exports = function (options) {
  return new TestConnection(options);
};

var TestConnection = function (options) {
  options = options || {};
  this._host = options.host || 'localhost';
  this._port = options.port || 27017;
  this._database = options.database || 'testing';
  this.db = options.db;
  this._collections = {};
};

TestConnection.prototype._connect = function (cb) {
  if (this.db) {
    if (this.db.serverConfig.connected) return cb();
    return this.db.open(cb);
  }

  var me = this;
  MongoClient.connect('mongodb://' + this._host + ':' + this._port + '/' +
      this._database, function (err, db) {
    if (err) return cb(err);
    me.db = db;
    cb();
  });
};

TestConnection.prototype._collection = function (collection) {
  var col = this._collections[collection];
  if (col) return col;
  col = this._collections[collection] = this.db.collection(collection);
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
  this.db.dropDatabase(function (err) {
    if (err) return cb(err);
    me.db.close(function (err) {
      if (err) return cb(err);
      me.db = null;
      cb();
    });
  });
};

var insert = function (test, collections, collectionNames, index, cb) {
  if (index === collectionNames.length) return cb();
  var collection = collectionNames[index];
  test._collection(collection).insert(collections[collection], function (err) {
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
    projection = { _id: false };
  } else if (len === 3) {
    cb = projection;
    projection = { _id: false };
  }
  this._collection(collection).find(query, projection).toArray(cb);
};

TestConnection.prototype.last = function (collection, projection, cb) {
  if (arguments.length === 2) {
    cb = projection;
    projection = { _id: false };
  }
  this._collection(collection).find(null, projection).sort({ $natural: -1 })
      .limit(1).nextObject(cb);
};

TestConnection.prototype.drop = function (collection, cb) {
  // Recreate the database
  var me = this;
  this._collection(collection).drop(function (err) {
    // Don't expose 'reply' argument
    me._collections[collection] = null;
    cb(err);
  });
};

TestConnection.prototype.reset = function (cb) {
  // Recreate the database
  this.db.dropDatabase(function (err) {
    // Don't expose 'results' argument
    cb(err);
  });
};