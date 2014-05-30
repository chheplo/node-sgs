
var http = require("http");
var resourcesRegexp = /^\/resources\/(.+)$/;
var callback = require("callback-stream");
var bunyan = require("bunyan");
var st = require("st");
var corsify = require("corsify");

function HTTP(opts, done) {
  if (!(this instanceof HTTP)) {
    return new HTTP(opts, done);
  }

  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }

  var that = this;
  this._persistence = opts.sgs.persistence;
  this._sgs = opts.sgs;
  var logger = this._logger = opts.sgs.logger.child({
    service: 'HTTP',
    serializers: {
      req: bunyan.stdSerializers.req,
      res: bunyan.stdSerializers.res
    }
  });
  this.server = http.createServer(this.buildServer(opts));
  this.server.listen(opts.port, opts.host, function(err) {
    done(err, that);
    logger.info({ port: opts.port }, "server started");
  });

  if (this._sgs.mqtt) {
    this._sgs.mqtt.attachHttpServer(this.server);
  }
}

HTTP.prototype.close = function(done) {
  this.server.close(done);
};

HTTP.prototype.buildServer = function(opts) {
  var logger = this._logger;
  var persistence = this._persistence;
  var sgs = this._sgs;

  var handlePontePublic = st(__dirname + "/../public", {
    index: false,
    passthrough: true
  });

  var handleMoscaPublic = st(__dirname + "/../node_modules/mosca/public", {
    index: false,
    passthrough: false
  });

  function handleGetResource(req, res) {
    var match = req.url.match(resourcesRegexp);
    if (req.method !== 'GET' || !match) {
      return false;
    }

    var topic = match[1];

    persistence.lookupRetained(topic, function(err, packets) {
      if (packets.length === 0) {
        res.statusCode = 404;
        res.end('Not found');
      } else {
        res.end(packets[0].payload);
      }
    });

    return true;
  }

  function handlePutResource(req, res) {
    var match = req.url.match(resourcesRegexp);
    if (req.method !== 'PUT' && req.method !== 'POST' || !match) {
      return false;
    }

    var topic = match[1];

    req.pipe(callback(function(err, payload) {
      payload = payload.toString() + " annotated(HTTP)";
      // Receiving msg from HTTP
      console.log(payload);
      var packet = { topic: topic, payload: payload, retain: true };
      persistence.storeRetained(packet, function() {
        sgs.broker.publish(topic, payload, {}, function() {
          res.setHeader('Location', '/resources/' + topic);
          res.statusCode = 204;
          res.end();
          sgs.emit('updated', topic, new Buffer(payload));
        });
      });
    }));

    return true;
  }

  return corsify({
    endOptions: true
  }, function httpServer(req, res) {
    logger.info({ req: req });

    res.on('finish', function() {
      logger.info({ res: res });
    });

    var handled =
      handleGetResource(req, res) ||
      handlePutResource(req, res);

    if (handled) {
      return;
    }

    if (opts.serveLibraries) {
      handlePontePublic(req, res, function() {
        handleMoscaPublic(req, res);
      });
    } else {
      res.writeHeader(404);
      res.end("Not Found");
    }
  });
};

module.exports = HTTP;
