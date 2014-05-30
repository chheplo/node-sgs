

var async = require("async");
var servers = require("./servers.js");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var xtend = require("xtend");

function SGS(opts, done) {
  if (!(this instanceof SGS)) {
    return new SGS(opts, done);
  }

  if (typeof opts === "function") {
    done = opts;
    opts = {};
  }

  this.options = opts;

  var that = this;

  async.eachSeries(servers, function(obj, cb) {
    opts[obj.service] = xtend(obj.defaults, opts[obj.service]);
    opts[obj.service].sgs = that;
    obj.factory(opts[obj.service], function(err, instance) {
      that[obj.service] = instance;
      cb(err);
    });
  }, function(err) {
    if (done) {
      done(err, that);
    }
  });
}

util.inherits(SGS, EventEmitter);

SGS.prototype.close = function close(done) {
  var that = this;
  var reversed = [].concat(servers).reverse();
  async.eachSeries(reversed, function closeEverything(obj, cb) {
    if (typeof that[obj.service].close === "function") {
      that[obj.service].close(cb);
    } else {
      cb();
    }
  }, done);
};

SGS.cli = require("./cli");

module.exports = SGS;
