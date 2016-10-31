const DataLayerErrors = {
  connectionError: 1,
  connectionDrop: 2,
  connectionTimeout: 3
};

/**
 * Low level wrapper for the underlying database. You must connect a module before starting using it.
 *
 * Connect a module colling the connectModule method.
 *
 * @param options
 * @param rdb
 * @constructor
 */
function DataLayer(options, rdb) {
  const r = rdb || require('rethinkdb');

  this._options = options || {};

  this._connection = null;

  this._connecting = false;

  /**
   * Initialise the connection
   *
   * @param module
   */
  this.connectModule = function (module) {
    const self = this;
    if (null === this._connection && !this._connecting) {
      this._connecting = true;
      r.connect(this._options, function (err, conn) {
        if (err) module(new Error('Unable to connect to the database', DataLayerErrors.connectionError), null);
        else {
          self._connection = conn;
          self._connecting = false;
          self.monitorConnection();
          module(null, self);
        }
      });
    } else if (this._connecting) {
      var ticker = setInterval(function () {
        if (!self._connecting) {
          clearInterval(ticker);
          module(null, self);
        }
      }, 100);
    } else {
      module(null, this);
    }
  };

  /**
   * Monitor the connection and throw an error in case of failure
   */
  this.monitorConnection = function (errorHandler) {
    function failedConnection(code, error) {
      return errorHandler ? errorHandler : function () {
        throw new Error('Database connection failure', code);
      };
    }

    if ('function' === typeof this._connection.on) {
      this._connection.on('error', failedConnection(DataLayerErrors.connectionError));
      this._connection.on('close', failedConnection(DataLayerErrors.connectionDrop));
      this._connection.on('timeout', failedConnection(DataLayerErrors.connectionTimeout));
    }
  };

  /**
   * Returns the options.
   *
   * @returns {{}}
   */
  this.getOptions = function () {
    return this._options;
  };

  /**
   * Returns the RethinkDb connection.
   *
   * @returns r.net.Connection
   */
  this.getConnection = function () {
    return this._connection;
  };

  /**
   * Returns the database native query builder
   *
   * @return rethinkdb
   */
  this.query = function () {
    return r;
  };

  /**
   * Execute the given query against the database and return the results to the callback
   *
   * @param query
   * @param callback
   */
  this.execute = function (query, callback) {
    try {
      query.run(this._connection, callback);
    } catch (e) {
      callback(e)
    }
  };

  // shorthand self-explanatory methods

  this.dbList = function (callback) {
    this.execute(this.query().dbList(), callback);
  };

  this.dbCreate = function (database, callback) {
    this.execute(this.query().dbCreate(database), callback);
  };

  this.tableList = function (database, callback) {
    this.execute(this.query().db(database).tableList(), callback);
  };

  this.tableCreate = function (database, table, callback) {
    this.execute(this.query().db(database).tableCreate(table), callback);
  };

  this.tableDelete = function (database, table, callback) {
    this.execute(this.query().db(database).tableDrop(table), callback);
  };

  this.get = function (database, table, id, callback) {
    this.execute(this.query().db(database).table(table).get(id), callback);
  };

  this.delete = function (database, table, id, callback) {
    this.execute(this.query().db(database).table(table).get(id).delete(), callback);
  };

  this.insert = function (database, table, document, options, callback) {
    this.execute(this.query().db(database).table(table).insert(document, options), callback);
  };
}

exports.DataLayerErrors = DataLayerErrors;
exports.DataLayer = DataLayer;
