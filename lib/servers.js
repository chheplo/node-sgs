
var mosca = require("mosca");
var HTTP = require("./http");
var CoAP = require("./coap");
var persistence = require("./persistence");
var ascoltatori = require("ascoltatori");
var bunyan = require("bunyan");
var xtend = require("xtend");

module.exports = [{
  service: "logger",
  factory: function(opts, done) {
    delete opts.sgs;
    done(null, bunyan.createLogger(opts));
  },
  defaults: {
    name: "sgs",
    level: 40
  }
}, {
  service: 'broker',
  factory: function(opts, done) {
    opts.json = false;
    ascoltatori.build(opts, function(ascoltatore) {
      done(null, ascoltatore);
    });
  }
}, {
  service: "persistence",
  factory: persistence,
  defaults: {
    type: "memory"
  }
}, {
  service: "mqtt",
  factory: function(opts, cb) {

    opts.ascoltatore = opts.sgs.broker;

    opts.logger = xtend(opts.logger || {}, {
      childOf: opts.sgs.logger,
      level: opts.sgs.logger.level(),
      service: "MQTT"
    });
    var server = new mosca.Server(opts, cb);
    server.on('published', function moscaPonteEvent(packet) {
      //Receiving msg from MQTT
      if (packet.topic == "temperature-MQTT"){
          packet.payload = packet.payload.toString();
      }
      opts.sgs.emit('updated', packet.topic, packet.payload);
    });

      // fired when a client connects
      server.on('clientConnected', function(client) {
          console.log('Client Connected:', client.id);
      });

     // fired when a client disconnects
      server.on('clientDisconnected', function(client) {
          console.log('Client Disconnected:', client.id);
      });

    opts.sgs.persistence.wire(server);
  }
}, {
  service: "http",
  factory: HTTP,
  defaults: {
    port: 3000,
    serveLibraries: true
  }
}, {
  service: "coap",
  factory: CoAP,
  defaults: {
    port: 5683
  }
}];
