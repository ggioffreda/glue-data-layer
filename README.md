Glue - Data Layer
=================

This tiny library adds a level of abstraction on top of RethinkDB with few main 
goals:

- delegating the connection related logic;
- providing shorthand methods for common operations;
- providing a cleaner way to query the database with no need for user library to
  access the low level connection.

[![Build Status](https://travis-ci.org/ggioffreda/glue-data-layer.svg?branch=master)](https://travis-ci.org/ggioffreda/glue-data-layer)

Usage
-----

To better understand what's this all about this section presents three examples 
of common logic executed consuming the RethinkDB API directly or through this
library.

### Connecting

Connecting to RethinkDB without this library:

```javascript
var r = require('rethinkdb');
var connection = null;

r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
  if (err) throw err;
  connection = conn;
  // database is ready, activate your other stuff ...
});
```

Using the library:

```javascript
var DataLayer = require('glue-data-layer').DataLayer;
var dl = new DataLayer({host: 'localhost', port: 28015});

dl.connectModule(function(err, dl) {
  if (err) throw err;
  // database is ready, activate your other stuff ...
});
```

The code is pretty much the same, main difference here is that you can share the
same connection among multiple modules. Your callback will be called only once the
connection is established and you can start querying your data straight away.

### Querying

Querying directly RethinkDB without this library:

```javascript
r.db('test').tableCreate('authors').run(connection, function(err, result) {
  if (err) throw err;
  console.log(JSON.stringify(result, null, 2));
});

r.table('authors').insert([
  { name: "William Adama" },
  { name: "Laura Roslin" },
  { name: "Jean-Luc Picard" }
]).run(connection, function(err, result) {
  if (err) throw err;
  console.log(JSON.stringify(result, null, 2));
});
```

Using the library:

```javascript
dl.tableCreate('test', 'authors', function(err, result) {
  if (err) throw err;
  console.log(JSON.stringify(result, null, 2));
});

dl.insert('test', 'authors', [
  { name: "William Adama" },
  { name: "Laura Roslin" },
  { name: "Jean-Luc Picard" }
], function(err, result) {
  if (err) throw err;
  console.log(JSON.stringify(result, null, 2));
});
```

The code is very similar again, the main difference is that your module does not
have to handle the `connection` directly and can delegate that to the data layer.

### Monitoring

Monitoring the connection directly without this library:

```javascript
var handleConnectionLost = function(error) {
  if (error) throw error;
  // handle connection closed without errors
};

connection.on('error', handleConnectionLost);
connection.on('close', handleConnectionLost);
connection.on('timeout', handleConnectionLost);
```

Using the library:

```javascript
var handleConnectionLost = function(error) {
  if (error) throw error;
  // handle connection closed without errors
};

dl.monitorConnection(handleConnectionLost);

// or even just

dl.monitorConnection();
```

In this case the difference is that you can activate the connection monitoring in
just one call, and if you don't have special needs when the connection is lost
you can even just rely on the data layer to throw an error when that happens.

Installation
------------

You can install this library using `npm`:

    npm install glue-data-layer

API
---

In the list that follows the `callback` parameter is optional and is expected to
be a NodeJS callback like function expecting an error as first argument and 
additional optional parameters returned by the method called.

Connecting and monitoring:

- **connectModule**(callback): connects a module to the data layer, the callback
  will receive an instance of the data layer or an error if any occurs;
  
- **monitorConnection**(errorHandler): enables monitoring of the connection in
  case it errors, times out or gets closed. If you don't specify a custom handler
  the default behaviour is to throw an error since the data layer becomes 
  unusable if the connection to RethinkDB is lost.

These are the shorthand methods, they are pretty self-explanatory. The parameters
passed to the callback are exactly the same as those passed by the underlying 
calls to RethinkDB so you can double check their documentation to have an idea on
what to expect.

- **dbList**(callback)
- **dbCreate**(databaseName, callback)
- **tableList**(databaseName, callback)
- **tableCreate**(databaseName, tableName, callback)
- **tableDelete**(databaseName, tableName, callback)
- **get**(databaseName, tableName, id, callback)
- **delete**(databaseName, tableName, id, callback)
- **insert**(databaseName, tableName, document, options, callback)

Low level access and querying is enabled by the following methods:

- **query**(): returns the wrapped instance of RethinkDB so you can build your
  custom queries on it, ie: `dl.query().filter({"username":"john.doe"})`;
  
- **execute**(query, callback): executes the given query and return the result
  "as is" to the callback;
  
- **getOptions**(): returns the options used to establish the connection;

- **getConnection**(): returns the established connection.

Test
----

Run the tests with:

    $ npm test
