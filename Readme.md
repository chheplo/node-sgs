SGS
===

## Installing necessary packages

Necessary node.js packages are included in the node_modules folders. Some of the these modules are modified to accommodate semantic annotation. We recommend to use the included files instead of latest version of those packages.
You also need CoAP client package. Install using,

```
$sudo npm install coap-cli -g
```

Similarly Installing MQTT client, mosquitto, using brew on Mac OS x,

```
$ brew install mosquitto
```



## Testing pulishing from one protocol to another
Run the sgs.js file using node.js.
Check out the message translation and semantic annotation using following commands on terminal.
### CoAP -> CoAP, MQTT

COAP PUT

```
echo -n '{"Platform":"ArduinoBase1","Observation":"LightObservation","Sensor":"BMP1750","ObservationValue":"1200","ObservationUnit":"Lux"}' | coap put coap://localhost/r/light-COAP
```

And receive using,

CoAP GET

```
coap -o coap://localhost/r/light-COAP
```

MQTT subscribe

```
mosquitto_sub -t "light-COAP" -v
```

### HTTP -> CoAP, MQTT
HTTP PUT

```
curl -X PUT -d '{"Platform":"ArduinoBase1","Observation":"HumidityObservation","Sensor":"HIH4030","ObservationValue":"50","ObservationUnit":"%"}'  http://localhost:3000/resources/humidity-HTTP
```

And receive using,

CoAP GET

```
coap -o coap://localhost/r/humidity-HTTP
```

MQTT subscribe

```
mosquitto_sub -t "humidity-HTTP" -v
```

### MQTT -> CoAP,MQTT
MQTT publish

```
mosquitto_pub -t temperature-MQTT -m '{"Platform":"ArduinoBase1","Observation":"TemperatureObservation","Sensor":"TMP102","ObservationValue":"22","ObservationUnit":"Celsius"}' -r
```

And receive using,

CoAP GET

```
coap -o coap://localhost/r/temperature-MQTT
```

MQTT subsribe

```
mosquitto_sub -t "temperature-MQTT" -v
```


## Base reading from a Sensor

The sample json file sent from the sensor node is,

```
{
    "Platform":"ArduinoBase1",
    "Observation":"TemperatureObservation",
    "Sensor":"TMP102",
    "ObservationValue":"22",
    "ObservationUnit":"Celsius"
}
```


Special Thanks to Matteo Collina and Eclipse Ponte project.
This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * and Eclipse Distribution License v1.0 which accompany this distribution.