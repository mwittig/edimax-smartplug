# edimax-smartplug

[![Build Status](https://travis-ci.org/mwittig/edimax-smartplug.svg)](https://travis-ci.org/mwittig/edimax-smartplug)

Node module to communicate with Edimax Smart Plugs. The library utilizes Bluebird 
promises - https://github.com/petkaantonov/bluebird. Device requests will be executed sequentially. 
This is useful as the Smart Plug REST service does not properly chain incoming requests. It provides the 
following features:

* Device Discovery - Smart Plugs can be automatically discovered on a given network 
  (see section "Device Discovery" below for details)
* Switching - Apart from switching Smart Plugs on and off, it is possible to read the current switch state 
* Usage Metering - For 'SP2101W' Smart Plugs it is possible to access the current, accumulated, and historical
  energy usage metering data 


## Usage Examples

    var smartplug = require('./index');
    var options = {
        timeout: 10000,
        name:'edimax',
        host:'192.168.178.65',
        username: 'admin',
        password: '1234'
    };
    
    
    smartplug.getDeviceInfo(options).then(function (info) {
        console.log(info);
    }).catch(function(e) {console.log("Request failed: ", e)});
    
    smartplug.getSchedule(options).then(function (schedule) {
        console.log(schedule);
    }).catch(function(e) {console.log("Request failed: ", e)});
    
    // set switch ON
    smartplug.setSwitchState(true, options).catch(function(e) {console.log("Request failed: ", e)});
    
    smartplug.getSwitchPower(options).then(function (power) {
        console.log("Current switch power", power, "Watts");
    }).catch(function(e) {console.log("Request failed: ", e)});
    
    smartplug.getSwitchEnergy(options).then(function (energy) {
        console.log("getSwitchEnergy result:", energy);
    }).catch(function(e) {console.log("Request failed: ", e)});
    
    smartplug.getStatusValues(true, options).then(function (all) {
        console.log("getStatusValues result:", all);
    }).catch(function(e) {console.log("Request failed: ", e)});
    
    // set switch OFF
    smartplug.setSwitchState(false, options).catch(function(e) {console.log("Request failed: ", e)});
    
    // get switch status
    smartplug.getSwitchState(options).then(function (state) {
        console.log("Switch status is", state?"ON":"OFF");
    }).catch(function(e) {console.log("Request failed: ", e)});
    
    // get the daily history of power measured consumption for the given date range
    smartplug.getHistory('DAY', '20160825', '20160830', options).then(function (results) {
        console.log("getHistory result", results);
    }).catch(function(e) {console.log("Request failed: ", e)});
    
    // discover devices
    smartplug.discoverDevices({
        timeout: 3000,
        address: "192.168.178.255"
    }).then(function (results) {
        console.log("Discovery Result:", results);
    }).catch(function(e) {console.log("Request failed: ", e)});
    
## Device Discovery

The device discovery implementation is based on the findings summarized in a 
[blog post](http://blog.guntram.de/?p=45) (thanks, Guntram). As the discovery 
mechanism may also be used for other Edimax products, e.g. IP cameras, you should filter
by model name to make sure the found device is a smart plug ('SP2101W' and 'SP2101W'). The method `discoverDevices()` 
accepts the following options:

| Property  | Default           | Type    | Description                                 |
|:----------|:------------------|:--------|:--------------------------------------------|
| address   | "255.255.255.255" | String  | The broadcast address                       |
| timeout   | 3000              | Integer | The timeout in milliseconds for discovery   |

Note: Using the global broadcast address on Windows may yield unexpected results. On Windows, 
global broadcast packets will only be routed via the first network adapter which may cause problems
with multi-homed setups and virtual network adapters. If you want to use a broadcast address 
though, use a network-specific address, e.g. for `192.168.0.1/24` use `192.168.0.255`.

A discovery request returns a promise which yields an array with the discovery items on completion. An item is 
an object with the following properties:

| Property      | Type    | Example          | Description                    |
|:--------------|:--------|:-----------------|:-------------------------------|
| manufacturer  | String  | 'EDIMAX'         | The manufacturer of the device |
| model         | String  | 'SP2101W'        | The model name                 |
| version       | String  | '2.03'           | The firmware version           |
| displayName   | String  | 'edimax'         | The assigned device name       |
| addr          | String  | '192.168.178.65' | The IP address of the device   |
| dstAddr       | String  | '192.168.178.1'  | The IP address of the gateway  |
    
## TODO

* More Documentation
* Make request chaining optional. In some cases, request/response interleaving does not matter
* Add tests

## History

See [Release History](https://github.com/mwittig/edimax-smartplug/blob/master/HISTORY.md).

## License 

Copyright (c) 2015-2016, Marcus Wittig and contributors. All rights reserved.

[MIT License](https://github.com/mwittig/edimax-smartplug/blob/master/LICENSE)
